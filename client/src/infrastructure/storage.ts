// Infrastruktur-lag for al lokal filhåndtering.
// Denne modul gemmer og læser projekter/opgaver/vedhæftninger via File System Access API
// i en fast mappe-struktur under den arbejdsmappe brugeren vælger.
import type {
  AttachmentRecord,
  CommentRecord,
  ProjectRecord,
  TaskPriority,
  TaskRecord,
  TaskStatus,
} from "../types";

// Udvid global Window-type, så TypeScript kender showDirectoryPicker,
// som kun findes i Chromium-browsere.
declare global {
  interface Window {
    showDirectoryPicker?: (options?: { mode?: "read" | "readwrite" }) => Promise<FileSystemDirectoryHandle>;
  }
}

// Tilladte status-/prioritetsværdier og mappe-layout under arbejdsmappe.
const STATUS_VALUES: TaskStatus[] = ["backlog", "todo", "doing", "done"];
const PRIORITY_VALUES: TaskPriority[] = ["Low", "Medium", "High", "Critical"];
const ROOT_DIR_NAME = "project-data";
const PROJECTS_DIR_NAME = "projects";

// En arbejdsmappe er roden, som brugeren vælger via showDirectoryPicker.
type WorkspaceHandle = FileSystemDirectoryHandle;

const encoder = new TextEncoder();
const decoder = new TextDecoder();

// Gør vilkårlige navne sikre at bruge som fil-/mappenavne.
// Bruges til projekt-slugs, task-slugs og filnavne til vedhæftninger.
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

// Sørger for at tasks, der læses fra disk, altid har gyldige felter
// (fx hvis ældre filer mangler properties).
function ensureTaskDefaults(task: TaskRecord): TaskRecord {
  return {
    ...task,
    status: STATUS_VALUES.includes(task.status) ? task.status : "todo",
    priority: PRIORITY_VALUES.includes(task.priority) ? task.priority : "Medium",
    comments: Array.isArray(task.comments) ? task.comments : [],
    attachments: Array.isArray(task.attachments) ? task.attachments : [],
  };
}

// Eksponeres for tests, så vi kan verificere normalisering uden
// at skulle ramme filsystemet.
export function normalizeTaskFromDisk(task: TaskRecord): TaskRecord {
  return ensureTaskDefaults(task);
}

// Læs/skriv JSON-filer i en given directory.
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

// Gemmer vilkårlig binær data (bruges til vedhæftede filer).
async function writeBinaryFile(dir: FileSystemDirectoryHandle, fileName: string, data: Blob | ArrayBuffer) {
  const handle = await dir.getFileHandle(fileName, { create: true });
  const writer = await handle.createWritable();
  await writer.write(data);
  await writer.close();
}

// Wrapper om removeEntry så vi kan styre recursive-flaget fra ét sted.
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

// Mappe for vedhæftninger:
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
// Bruges bl.a. når projekter omdøbes (og dermed får nyt slug).
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

// Gemmer en task til disk, og rydder op i den gamle fil hvis slug ændres.
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

// Læser alle gyldige projekter fra disk og sorterer dem alfabetisk.
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

  return projects.sort((a, b) => a.name.localeCompare(b.name));
}

// Læser alle tasks for et projekt, sikrer defaults og sorterer efter order/titel.
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
  if (!task) throw new Error("Opgaven blev ikke fundet.");
  return task;
}

// Sørger for at projekter får unikke slugs selv ved navnekollisioner
// (bruger timestamp-suffix i kollisionstilfælde).
async function ensureUniqueProjectSlug(workspace: WorkspaceHandle, baseSlug: string, excludeSlug?: string) {
  const projects = await loadProjects(workspace);
  let slug = baseSlug;
  while (projects.some((project) => project.slug === slug && project.slug !== excludeSlug)) {
    slug = `${baseSlug}-${Math.floor(Date.now() / 1000)}`;
  }
  return slug;
}

// Sørger for at tasks i et projekt får unikke slugs, også når titler genbruges.
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
    throw new Error(
      "Din nuværende browser understøtter ikke mappeadgang. Prøv i stedet i Chrome, Edge, Brave eller en anden moderne browser baseret på Chromium."
    );
  }
  return window.showDirectoryPicker({ mode: "readwrite" });
}

export async function listProjects(workspace: WorkspaceHandle) {
  return loadProjects(workspace);
}

// Opretter et nyt projekt med unikt navn og slug
// og initialiserer tilhørende tasks-/attachments-mapper.
export async function createProject(workspace: WorkspaceHandle, input: { name: string; color?: string }) {
  const name = input.name.trim();
  if (!name) throw new Error("Projektnavn er påkrævet.");
  const projects = await loadProjects(workspace);
  if (projects.some((project) => project.name.toLowerCase() === name.toLowerCase())) {
    throw new Error("Projektnavn skal være unikt.");
  }

  const slug = await ensureUniqueProjectSlug(workspace, slugify(name));
  const project: ProjectRecord = {
    id: `project_${crypto.randomUUID().slice(0, 8)}`,
    name,
    slug,
    color: input.color?.trim() || "#bf5b39",
    archived: false,
    createdAt: new Date().toISOString(),
  };

  const projectDir = await getProjectDir(workspace, slug, true);
  await projectDir.getDirectoryHandle("tasks", { create: true });
  await projectDir.getDirectoryHandle("attachments", { create: true });
  await writeJsonFile(projectDir, "project.json", project);
  return project;
}

// Opdaterer navn/farve/arkiveret-flag på et projekt.
// Hvis navnet ændres, flytter vi hele projektmappen til ny slug
// og opdaterer projectSlug på alle tilhørende tasks.
export async function updateProject(
  workspace: WorkspaceHandle,
  currentSlug: string,
  input: Partial<Pick<ProjectRecord, "name" | "color" | "archived">>,
) {
  const projectDir = await getProjectDir(workspace, currentSlug);
  const project = await readJsonFile<ProjectRecord>(projectDir, "project.json");
  const nextName = input.name?.trim() || project.name;
  const projects = await loadProjects(workspace);

  if (
    projects.some(
      (entry) => entry.slug !== currentSlug && entry.name.toLowerCase() === nextName.toLowerCase(),
    )
  ) {
    throw new Error("Projektnavn skal være unikt.");
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

export async function deleteProject(workspace: WorkspaceHandle, projectSlug: string) {
  const projectsRoot = await getProjectsRoot(workspace);
  await removeEntry(projectsRoot, projectSlug, true);
}

export async function listTasks(workspace: WorkspaceHandle, projectSlug: string) {
  return loadTasks(workspace, projectSlug);
}

// Opretter en ny task i et projekt, med:
// - unik slug inden for projektet,
// - order-værdi der placerer den sidst i sin status-kolonne.
export async function createTask(
  workspace: WorkspaceHandle,
  projectSlug: string,
  input: Partial<Pick<TaskRecord, "title" | "description" | "assignee" | "deadline" | "priority" | "status">>,
) {
  const title = input.title?.trim();
  if (!title) throw new Error("Opgavetitel er påkrævet.");

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

// Opdaterer en eksisterende task og sørger for:
// - at titlen ikke bliver tom,
// - at slug/order justeres korrekt når titel/status ændres.
export async function updateTask(
  workspace: WorkspaceHandle,
  projectSlug: string,
  taskId: string,
  input: Partial<Omit<TaskRecord, "id" | "comments" | "attachments">>,
) {
  const task = await loadTaskById(workspace, projectSlug, taskId);
  if (input.title !== undefined && !input.title.trim()) {
    throw new Error("Opgavetitel er påkrævet.");
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

// Flytter en task inden for samme projekt til en ny status + given rækkefølge.
// Vi beregner nye order-værdier ud fra orderedTaskIds, så boardet kan gemme sortering.
export async function moveTask(
  workspace: WorkspaceHandle,
  projectSlug: string,
  taskId: string,
  input: { status: TaskStatus; orderedTaskIds: string[] },
) {
  const tasks = await loadTasks(workspace, projectSlug);
  const task = tasks.find((entry) => entry.id === taskId);
  if (!task) throw new Error("Opgaven blev ikke fundet.");

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
// - beregner ny order i målprojektet,
// - sørger for unik slug i målprojektet,
// - flytter evt. vedhæftninger til ny attachments-mappe.
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

// Sletter en task og dens vedhæftnings-mappe (hvis den findes).
export async function deleteTask(
  workspace: WorkspaceHandle,
  projectSlug: string,
  taskId: string,
) {
  const tasksDir = await getTasksDir(workspace, projectSlug);
  const tasks = await loadTasks(workspace, projectSlug);
  const task = tasks.find((entry) => entry.id === taskId);
  if (!task) throw new Error("Opgaven blev ikke fundet.");

  const fileName = `${task.slug}.json`;
  if (await fileExists(tasksDir, fileName)) {
    await removeEntry(tasksDir, fileName);
  }

  try {
    const attachmentsBase = await getAttachmentsDir(workspace, projectSlug);
    await removeEntry(attachmentsBase, taskId, true);
  } catch {
    // Ingen vedhæftninger at fjerne.
  }
}

// Tilføjer en kommentar til en task (append-only).
export async function addComment(
  workspace: WorkspaceHandle,
  projectSlug: string,
  taskId: string,
  text: string,
) {
  const trimmed = text.trim();
  if (!trimmed) throw new Error("Kommentartekst er påkrævet.");

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

// Lagrer en vedhæftet fil og registrerer metadata på tasken.
// Filer navngives med timestamp + slugified filnavn for at undgå kollisioner.
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

// Læser den binære fil bag en AttachmentRecord.
export async function readAttachmentFile(
  workspace: WorkspaceHandle,
  projectSlug: string,
  taskId: string,
  storedName: string,
) {
  const dir = await getAttachmentsDir(workspace, projectSlug, taskId);
  return (await dir.getFileHandle(storedName)).getFile();
}

// Fjerner en vedhæftning fra både filsystemet og taskens attachments-liste.
export async function deleteAttachment(
  workspace: WorkspaceHandle,
  projectSlug: string,
  taskId: string,
  fileId: string,
) {
  const task = await loadTaskById(workspace, projectSlug, taskId);
  const attachment = task.attachments.find((entry) => entry.id === fileId);
  if (!attachment) throw new Error("Vedhæftning blev ikke fundet.");

  const dir = await getAttachmentsDir(workspace, projectSlug, taskId);
  await removeEntry(dir, attachment.storedName);
  task.attachments = task.attachments.filter((entry) => entry.id !== fileId);
  await saveTask(workspace, task, task.slug);
}

