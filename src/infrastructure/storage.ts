import type {
  AttachmentRecord,
  CommentRecord,
  ProjectRecord,
  NoteRecord,
  TaskPriority,
  TaskRecord,
  TaskStatus,
} from "../types";
import { getStoredTextCatalog } from "../app/i18n/catalog";

// som kun findes i Chromium-browsere.
declare global {
  interface Window {
    showDirectoryPicker?: (options?: { mode?: "read" | "readwrite" }) => Promise<FileSystemDirectoryHandle>;
  }
}

const STATUS_VALUES: TaskStatus[] = ["backlog", "todo", "doing", "done"];
const PRIORITY_VALUES: TaskPriority[] = ["Low", "Medium", "High", "Critical"];
const ROOT_DIR_NAME = "project-data";
const PROJECTS_DIR_NAME = "projects";

type WorkspaceHandle = FileSystemDirectoryHandle;

const CONFIG_FILE_NAME = "aipops.config.json";

const NOTES_FILE_NAME = "aipops.notes.json";

function storageText() {
  return getStoredTextCatalog().storage;
}

export type AppConfig = {
  ai?: {
    provider?: "openai";
    apiKey?: string;
    seenSetup?: boolean;
  };
  notifications?: {
    enabled?: boolean;
    reminderMinutes?: number;
  };
};

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function slugify(value: string) {
  return (
    value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || `item-${Date.now()}`
  );
}

function ensureTaskDefaults(task: TaskRecord): TaskRecord {
  return {
    ...task,
    status: STATUS_VALUES.includes(task.status) ? task.status : "todo",
    priority: PRIORITY_VALUES.includes(task.priority) ? task.priority : "Medium",
    comments: Array.isArray(task.comments) ? task.comments : [],
    attachments: Array.isArray(task.attachments) ? task.attachments : [],
  };
}

function hasValidProjectOrder(project: Partial<ProjectRecord>) {
  return typeof project.order === "number" && Number.isFinite(project.order);
}

function ensureProjectDefaults(project: ProjectRecord, fallbackOrder: number): ProjectRecord {
  return {
    ...project,
    order: hasValidProjectOrder(project) ? project.order : fallbackOrder,
  };
}

// at skulle ramme filsystemet.
export function normalizeTaskFromDisk(task: TaskRecord): TaskRecord {
  return ensureTaskDefaults(task);
}

async function readJsonFile<T>(dir: FileSystemDirectoryHandle, fileName: string): Promise<T> {
  const handle = await dir.getFileHandle(fileName);
  const file = await handle.getFile();
  return JSON.parse(await file.text()) as T;
}

async function writeJsonFile(dir: FileSystemDirectoryHandle, fileName: string, data: unknown) {
  const handle = await dir.getFileHandle(fileName, { create: true });
  const writer = await handle.createWritable();
  await writer.write(JSON.stringify(data, null, 2));
  await writer.close();
}

async function writeBinaryFile(dir: FileSystemDirectoryHandle, fileName: string, data: Blob | ArrayBuffer) {
  const handle = await dir.getFileHandle(fileName, { create: true });
  const writer = await handle.createWritable();
  await writer.write(data);
  await writer.close();
}

async function removeEntry(dir: FileSystemDirectoryHandle, name: string, recursive = false) {
  await dir.removeEntry(name, { recursive });
}

// Rod-mappe for alle projekter under arbejdsmappe:
// <workspace>/project-data/projects
async function getProjectsRoot(workspace: WorkspaceHandle) {
  const root = await workspace.getDirectoryHandle(ROOT_DIR_NAME, { create: true });
  return root.getDirectoryHandle(PROJECTS_DIR_NAME, { create: true });
}

// Mappe for et givent projekt:
// <workspace>/project-data/projects/<project-slug>
async function getProjectDir(workspace: WorkspaceHandle, projectSlug: string, create = false) {
  const projectsRoot = await getProjectsRoot(workspace);
  return projectsRoot.getDirectoryHandle(projectSlug, { create });
}

// Mappe for opgave-filer i et projekt:
// <project-dir>/tasks/*.json
async function getTasksDir(workspace: WorkspaceHandle, projectSlug: string, create = false) {
  const projectDir = await getProjectDir(workspace, projectSlug, create);
  return projectDir.getDirectoryHandle("tasks", { create });
}

// <project-dir>/attachments/<task-id>/<filnavne>
async function getAttachmentsDir(
  workspace: WorkspaceHandle,
  projectSlug: string,
  taskId?: string,
  create = false,
) {
  const projectDir = await getProjectDir(workspace, projectSlug, create);
  const base = await projectDir.getDirectoryHandle("attachments", { create });
  if (!taskId) return base;
  return base.getDirectoryHandle(taskId, { create });
}

// Simpel "eksisterer denne fil?"-helper, der udnytter exceptions.
async function fileExists(dir: FileSystemDirectoryHandle, fileName: string) {
  try {
    await dir.getFileHandle(fileName);
    return true;
  } catch {
    return false;
  }
}

export async function loadConfig(workspace: WorkspaceHandle): Promise<AppConfig | null> {
  try {
    if (!(await fileExists(workspace, CONFIG_FILE_NAME))) {
      return null;
    }
    return await readJsonFile<AppConfig>(workspace, CONFIG_FILE_NAME);
  } catch {
    return null;
  }
}

export async function saveConfig(workspace: WorkspaceHandle, config: AppConfig): Promise<void> {
  await writeJsonFile(workspace, CONFIG_FILE_NAME, config);
}

export type NotesFile = {
  version: 1;
  notes: NoteRecord[];
};

export async function loadNotes(workspace: WorkspaceHandle): Promise<NotesFile | null> {
  try {
    if (!(await fileExists(workspace, NOTES_FILE_NAME))) {
      return null;
    }
    const loaded = await readJsonFile<NotesFile>(workspace, NOTES_FILE_NAME);
    if (!loaded || loaded.version !== 1 || !Array.isArray(loaded.notes)) {
      return null;
    }
    return loaded;
  } catch {
    return null;
  }
}

export async function saveNotes(workspace: WorkspaceHandle, notes: NoteRecord[]): Promise<void> {
  const payload: NotesFile = {
    version: 1,
    notes,
  };
  await writeJsonFile(workspace, NOTES_FILE_NAME, payload);
}

async function copyFileHandleToDirectory(
  fromDir: FileSystemDirectoryHandle,
  fileName: string,
  toDir: FileSystemDirectoryHandle,
  toFileName?: string,
) {
  const file = await (await fromDir.getFileHandle(fileName)).getFile();
  await writeBinaryFile(toDir, toFileName ?? fileName, file);
}

// Rekursiv kopiering af en directory-struktur.
async function copyDirectory(source: FileSystemDirectoryHandle, target: FileSystemDirectoryHandle) {
  const anySource = source as any;
  if (typeof anySource.values === "function") {
    for await (const entry of anySource.values() as AsyncIterable<FileSystemHandle>) {
      if (entry.kind === "file") {
        await copyFileHandleToDirectory(source, entry.name, target);
      } else {
        const nextTarget = await target.getDirectoryHandle(entry.name, { create: true });
        await copyDirectory(entry as FileSystemDirectoryHandle, nextTarget);
      }
    }
  }
}

// "Renamer" en mappe ved at kopiere til ny dir og slette den gamle.
// File System Access API har ikke et direkte rename-kald.
async function renameDirectory(
  parent: FileSystemDirectoryHandle,
  fromName: string,
  toName: string,
) {
  if (fromName === toName) return;
  const source = await parent.getDirectoryHandle(fromName);
  const target = await parent.getDirectoryHandle(toName, { create: true });
  await copyDirectory(source, target);
  await removeEntry(parent, fromName, true);
}

function taskFileName(task: TaskRecord) {
  return `${task.slug}.json`;
}

async function saveTask(workspace: WorkspaceHandle, task: TaskRecord, previousSlug?: string) {
  const tasksDir = await getTasksDir(workspace, task.projectSlug, true);
  if (previousSlug && previousSlug !== task.slug) {
    const previousFile = `${previousSlug}.json`;
    if (await fileExists(tasksDir, previousFile)) {
      await removeEntry(tasksDir, previousFile);
    }
  }
  await writeJsonFile(tasksDir, taskFileName(task), task);
}

// Finder alle .json-filer i en tasks-mappe.
async function listTaskFiles(tasksDir: FileSystemDirectoryHandle) {
  const entries: string[] = [];
  const anyDir = tasksDir as any;
  if (typeof anyDir.values === "function") {
    for await (const entry of anyDir.values() as AsyncIterable<FileSystemHandle>) {
      if (entry.kind === "file" && entry.name.endsWith(".json")) {
        entries.push(entry.name);
      }
    }
  }
  return entries;
}

async function loadProjects(workspace: WorkspaceHandle) {
  const projectsRoot = await getProjectsRoot(workspace);
  const projects: ProjectRecord[] = [];

  const anyRoot = projectsRoot as any;
  if (typeof anyRoot.values === "function") {
    for await (const entry of anyRoot.values() as AsyncIterable<FileSystemHandle>) {
      if (entry.kind !== "directory") continue;
      try {
        projects.push(await readJsonFile<ProjectRecord>(entry as FileSystemDirectoryHandle, "project.json"));
      } catch {
        continue;
      }
    }
  }

  const alphabeticProjects = [...projects].sort((a, b) => a.name.localeCompare(b.name));
  return alphabeticProjects
    .map((project, index) => ensureProjectDefaults(project, index))
    .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
}

async function loadTasks(workspace: WorkspaceHandle, projectSlug: string) {
  const tasksDir = await getTasksDir(workspace, projectSlug, true);
  const fileNames = await listTaskFiles(tasksDir);
  const tasks = await Promise.all(
    fileNames.map(async (name) => ensureTaskDefaults(await readJsonFile<TaskRecord>(tasksDir, name))),
  );
  return tasks.sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));
}

// Finder en enkelt task ud fra id, og fejler hvis den ikke findes.
async function loadTaskById(workspace: WorkspaceHandle, projectSlug: string, taskId: string) {
  const tasks = await loadTasks(workspace, projectSlug);
  const task = tasks.find((entry) => entry.id === taskId);
  if (!task) throw new Error(storageText().taskNotFound);
  return task;
}

async function ensureUniqueProjectSlug(workspace: WorkspaceHandle, baseSlug: string, excludeSlug?: string) {
  const projects = await loadProjects(workspace);
  let slug = baseSlug;
  while (projects.some((project) => project.slug === slug && project.slug !== excludeSlug)) {
    slug = `${baseSlug}-${Math.floor(Date.now() / 1000)}`;
  }
  return slug;
}

async function ensureUniqueTaskSlug(
  workspace: WorkspaceHandle,
  projectSlug: string,
  baseSlug: string,
  excludeTaskId?: string,
) {
  const tasks = await loadTasks(workspace, projectSlug);
  let slug = baseSlug;
  while (tasks.some((task) => task.slug === slug && task.id !== excludeTaskId)) {
    slug = `${baseSlug}-${Math.floor(Date.now() / 1000)}`;
  }
  return slug;
}

export async function pickWorkspaceDirectory() {
  if (!window.showDirectoryPicker) {
    throw new Error(storageText().browserNoAccess);
  }
  return window.showDirectoryPicker({ mode: "readwrite" });
}

export async function listProjects(workspace: WorkspaceHandle) {
  return loadProjects(workspace);
}

// Opretter et nyt projekt med unikt navn og slug
export async function createProject(workspace: WorkspaceHandle, input: { name: string; color?: string }) {
  const name = input.name.trim();
  if (!name) throw new Error(storageText().projectNameRequired);
  const projects = await loadProjects(workspace);
  if (projects.some((project) => project.name.toLowerCase() === name.toLowerCase())) {
    throw new Error(storageText().projectNameUnique);
  }

  const slug = await ensureUniqueProjectSlug(workspace, slugify(name));
  const nextOrder =
    projects.reduce((maxOrder, project, index) => {
      const currentOrder = hasValidProjectOrder(project) ? project.order : index;
      return Math.max(maxOrder, currentOrder);
    }, -1) + 1;
  const project: ProjectRecord = {
    id: `project_${crypto.randomUUID().slice(0, 8)}`,
    name,
    slug,
    color: input.color?.trim() || "#bf5b39",
    archived: false,
    order: nextOrder,
    createdAt: new Date().toISOString(),
  };

  const projectDir = await getProjectDir(workspace, slug, true);
  await projectDir.getDirectoryHandle("tasks", { create: true });
  await projectDir.getDirectoryHandle("attachments", { create: true });
  await writeJsonFile(projectDir, "project.json", project);
  return project;
}

export async function updateProject(
  workspace: WorkspaceHandle,
  currentSlug: string,
  input: Partial<Pick<ProjectRecord, "name" | "color" | "archived" | "order">>,
) {
  const projectDir = await getProjectDir(workspace, currentSlug);
  const loadedProject = await readJsonFile<ProjectRecord>(projectDir, "project.json");
  const projects = await loadProjects(workspace);
  const fallbackOrder = projects.find((entry) => entry.slug === currentSlug)?.order ?? 0;
  const project = ensureProjectDefaults(loadedProject, fallbackOrder);
  const nextName = input.name?.trim() || project.name;

  if (
    projects.some(
      (entry) => entry.slug !== currentSlug && entry.name.toLowerCase() === nextName.toLowerCase(),
    )
  ) {
    throw new Error(storageText().projectNameUnique);
  }

  const nextSlug =
    nextName !== project.name
      ? await ensureUniqueProjectSlug(workspace, slugify(nextName), currentSlug)
      : currentSlug;

  const updatedProject: ProjectRecord = {
    ...project,
    name: nextName,
    slug: nextSlug,
    color: input.color?.trim() || project.color,
    archived: input.archived ?? project.archived,
    order: hasValidProjectOrder(input) ? input.order : project.order,
  };

  if (nextSlug !== currentSlug) {
    const projectsRoot = await getProjectsRoot(workspace);
    await renameDirectory(projectsRoot, currentSlug, nextSlug);
    const movedTasks = await loadTasks(workspace, nextSlug);
    await Promise.all(
      movedTasks.map((task) =>
        saveTask(workspace, { ...task, projectSlug: nextSlug }, task.slug),
      ),
    );
  }

  const nextProjectDir = await getProjectDir(workspace, nextSlug);
  await writeJsonFile(nextProjectDir, "project.json", updatedProject);
  return updatedProject;
}

export async function reorderProjects(workspace: WorkspaceHandle, orderedSlugs: string[]) {
  const projects = await loadProjects(workspace);
  const orderBySlug = new Map(orderedSlugs.map((slug, index) => [slug, index]));
  await Promise.all(
    projects.map(async (project, index) => {
      const nextOrder = orderBySlug.get(project.slug);
      if (nextOrder === undefined || nextOrder === project.order) {
        return;
      }
      const projectDir = await getProjectDir(workspace, project.slug);
      await writeJsonFile(projectDir, "project.json", {
        ...project,
        order: nextOrder,
      });
    }),
  );
}

export async function deleteProject(workspace: WorkspaceHandle, projectSlug: string) {
  const projectsRoot = await getProjectsRoot(workspace);
  await removeEntry(projectsRoot, projectSlug, true);
}

export async function listTasks(workspace: WorkspaceHandle, projectSlug: string) {
  return loadTasks(workspace, projectSlug);
}

// Opretter en ny task i et projekt, med:
// - unik slug inden for projektet,
export async function createTask(
  workspace: WorkspaceHandle,
  projectSlug: string,
  input: Partial<Pick<TaskRecord, "title" | "description" | "assignee" | "deadline" | "priority" | "status">>,
) {
  const title = input.title?.trim();
  if (!title) throw new Error(storageText().taskTitleRequired);

  const tasks = await loadTasks(workspace, projectSlug);
  const status = STATUS_VALUES.includes(input.status ?? "backlog")
    ? ((input.status ?? "backlog") as TaskStatus)
    : "backlog";
  const priority = PRIORITY_VALUES.includes(input.priority ?? "Medium")
    ? ((input.priority ?? "Medium") as TaskPriority)
    : "Medium";
  const slug = await ensureUniqueTaskSlug(workspace, projectSlug, slugify(title));
  const nextOrder =
    Math.max(0, ...tasks.filter((task) => task.status === status).map((task) => task.order)) + 1000;

  const task: TaskRecord = {
    id: `task_${crypto.randomUUID().slice(0, 8)}`,
    title,
    slug,
    description: input.description?.trim() || "",
    assignee: input.assignee?.trim() || "",
    deadline: input.deadline || null,
    priority,
    status,
    projectSlug,
    order: nextOrder,
    comments: [],
    attachments: [],
  };

  await saveTask(workspace, task);
  return task;
}

// - at titlen ikke bliver tom,
export async function updateTask(
  workspace: WorkspaceHandle,
  projectSlug: string,
  taskId: string,
  input: Partial<Omit<TaskRecord, "id" | "comments" | "attachments">>,
) {
  const task = await loadTaskById(workspace, projectSlug, taskId);
  if (input.title !== undefined && !input.title.trim()) {
    throw new Error(storageText().taskTitleRequired);
  }

  const nextTitle = input.title?.trim() || task.title;
  const nextStatus =
    input.status && STATUS_VALUES.includes(input.status) ? input.status : task.status;
  const nextSlug =
    nextTitle !== task.title
      ? await ensureUniqueTaskSlug(workspace, projectSlug, slugify(nextTitle), taskId)
      : task.slug;

  const allTasks = await loadTasks(workspace, projectSlug);
  const nextOrder =
    input.order !== undefined
      ? input.order
      : nextStatus !== task.status
        ? Math.max(
            0,
            ...allTasks
              .filter((entry) => entry.id !== task.id && entry.status === nextStatus)
              .map((entry) => entry.order),
          ) + 1000
        : task.order;

  const updated: TaskRecord = {
    ...task,
    ...input,
    title: nextTitle,
    slug: nextSlug,
    assignee: input.assignee?.trim() ?? task.assignee,
    description: input.description?.trim() ?? task.description,
    deadline: input.deadline === undefined ? task.deadline : input.deadline,
    priority:
      input.priority && PRIORITY_VALUES.includes(input.priority) ? input.priority : task.priority,
    status: nextStatus,
    order: nextOrder,
    projectSlug,
  };

  await saveTask(workspace, updated, task.slug);
  return updated;
}

export async function moveTask(
  workspace: WorkspaceHandle,
  projectSlug: string,
  taskId: string,
  input: { status: TaskStatus; orderedTaskIds: string[] },
) {
  const tasks = await loadTasks(workspace, projectSlug);
  const task = tasks.find((entry) => entry.id === taskId);
  if (!task) throw new Error(storageText().taskNotFound);

  const targetIds = input.orderedTaskIds.filter((id) => tasks.some((entry) => entry.id === id));
  const nextIds = targetIds.includes(taskId) ? targetIds : [...targetIds, taskId];
  const updates = tasks.filter((entry) => entry.status === input.status || nextIds.includes(entry.id));

  await Promise.all(
    updates.map((entry) =>
      saveTask(
        workspace,
        {
          ...entry,
          status: nextIds.includes(entry.id) ? input.status : entry.status,
          order: nextIds.includes(entry.id) ? (nextIds.indexOf(entry.id) + 1) * 1000 : entry.order,
        },
        entry.slug,
      ),
    ),
  );

  return loadTasks(workspace, projectSlug);
}

// Flytter en task til et andet projekt:
export async function moveTaskToProject(
  workspace: WorkspaceHandle,
  projectSlug: string,
  taskId: string,
  input: { targetProjectSlug: string; status?: TaskStatus },
) {
  const task = await loadTaskById(workspace, projectSlug, taskId);
  if (input.targetProjectSlug === projectSlug) {
    return updateTask(workspace, projectSlug, taskId, { status: input.status ?? task.status });
  }

  const targetTasks = await loadTasks(workspace, input.targetProjectSlug);
  const targetStatus = input.status ?? task.status;
  const nextOrder =
    Math.max(0, ...targetTasks.filter((entry) => entry.status === targetStatus).map((entry) => entry.order)) + 1000;
  const nextSlug = await ensureUniqueTaskSlug(workspace, input.targetProjectSlug, task.slug, task.id);

  const movedTask: TaskRecord = {
    ...task,
    projectSlug: input.targetProjectSlug,
    status: targetStatus,
    order: nextOrder,
    slug: nextSlug,
  };

  await saveTask(workspace, movedTask);

  const oldTasksDir = await getTasksDir(workspace, projectSlug);
  const oldFileName = `${task.slug}.json`;
  if (await fileExists(oldTasksDir, oldFileName)) {
    await removeEntry(oldTasksDir, oldFileName);
  }

  const oldAttachmentBase = await getAttachmentsDir(workspace, projectSlug);
  const targetAttachmentBase = await getAttachmentsDir(workspace, input.targetProjectSlug, undefined, true);
  try {
    const oldTaskAttachmentDir = await oldAttachmentBase.getDirectoryHandle(task.id);
    const newTaskAttachmentDir = await targetAttachmentBase.getDirectoryHandle(task.id, { create: true });
    await copyDirectory(oldTaskAttachmentDir, newTaskAttachmentDir);
    await removeEntry(oldAttachmentBase, task.id, true);
  } catch {
    // No attachments to move.
  }

  return movedTask;
}

export async function deleteTask(
  workspace: WorkspaceHandle,
  projectSlug: string,
  taskId: string,
) {
  const tasksDir = await getTasksDir(workspace, projectSlug);
  const tasks = await loadTasks(workspace, projectSlug);
  const task = tasks.find((entry) => entry.id === taskId);
  if (!task) throw new Error(storageText().taskNotFound);

  const fileName = `${task.slug}.json`;
  if (await fileExists(tasksDir, fileName)) {
    await removeEntry(tasksDir, fileName);
  }

  try {
    const attachmentsBase = await getAttachmentsDir(workspace, projectSlug);
    await removeEntry(attachmentsBase, taskId, true);
  } catch {
  }
}

export async function addComment(
  workspace: WorkspaceHandle,
  projectSlug: string,
  taskId: string,
  text: string,
) {
  const trimmed = text.trim();
  if (!trimmed) throw new Error(storageText().commentRequired);

  const task = await loadTaskById(workspace, projectSlug, taskId);
  const comment: CommentRecord = {
    id: `comment_${crypto.randomUUID().slice(0, 8)}`,
    text: trimmed,
    createdAt: new Date().toISOString(),
  };
  task.comments = [...task.comments, comment];
  await saveTask(workspace, task, task.slug);
  return comment;
}

export async function addAttachment(
  workspace: WorkspaceHandle,
  projectSlug: string,
  taskId: string,
  file: File,
) {
  const task = await loadTaskById(workspace, projectSlug, taskId);
  const dir = await getAttachmentsDir(workspace, projectSlug, taskId, true);
  const parts = file.name.split(".");
  const extension = parts.length > 1 ? `.${parts.pop()?.toLowerCase().replace(/[^a-z0-9]/g, "")}` : "";
  const safeName = slugify(parts.join(".") || "file");
  const storedName = `${Date.now()}-${safeName}${extension}`;

  await writeBinaryFile(dir, storedName, file);

  const attachment: AttachmentRecord = {
    id: `file_${crypto.randomUUID().slice(0, 8)}`,
    fileName: file.name,
    storedName,
    relativePath: `${ROOT_DIR_NAME}/${PROJECTS_DIR_NAME}/${projectSlug}/attachments/${taskId}/${storedName}`,
    size: file.size,
    uploadedAt: new Date().toISOString(),
  };

  task.attachments = [...task.attachments, attachment];
  await saveTask(workspace, task, task.slug);
  return attachment;
}

export async function readAttachmentFile(
  workspace: WorkspaceHandle,
  projectSlug: string,
  taskId: string,
  storedName: string,
) {
  const dir = await getAttachmentsDir(workspace, projectSlug, taskId);
  return (await dir.getFileHandle(storedName)).getFile();
}

export async function deleteAttachment(
  workspace: WorkspaceHandle,
  projectSlug: string,
  taskId: string,
  fileId: string,
) {
  const task = await loadTaskById(workspace, projectSlug, taskId);
  const attachment = task.attachments.find((entry) => entry.id === fileId);
  if (!attachment) throw new Error(storageText().attachmentNotFound);

  const dir = await getAttachmentsDir(workspace, projectSlug, taskId);
  await removeEntry(dir, attachment.storedName);
  task.attachments = task.attachments.filter((entry) => entry.id !== fileId);
  await saveTask(workspace, task, task.slug);
}





