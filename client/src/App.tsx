import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";
import type { ProjectRecord, TaskPriority, TaskRecord, TaskStatus } from "./types";
import {
  addAttachment,
  addComment,
  createProject,
  createTask,
  deleteAttachment,
  deleteTask,
  deleteProject,
  listProjects,
  listTasks,
  moveTaskToProject,
  pickWorkspaceDirectory,
  readAttachmentFile,
  updateProject,
  updateTask,
} from "./storage";

type WorkspaceHandle = FileSystemDirectoryHandle | null;

type PanelDraft = {
  title: string;
  description: string;
  assignee: string;
  deadline: string;
  priority: TaskPriority;
  projectSlug: string;
  status: TaskStatus;
};

const STATUS_LABELS: Record<TaskStatus, string> = {
  backlog: "Backlog",
  todo: "Klar",
  doing: "I gang",
  done: "Færdig",
};

const PRIORITY_LABELS: Record<TaskPriority, string> = {
  Low: "Lav",
  Medium: "Mellem",
  High: "Høj",
  Critical: "Kritisk",
};

const EMPTY_DRAFT: PanelDraft = {
  title: "",
  description: "",
  assignee: "",
  deadline: "",
  priority: "Medium",
  projectSlug: "",
  status: "backlog",
};

const WORKSPACE_DB_NAME = "simple-project-app";
const WORKSPACE_STORE_NAME = "workspace";

function openWorkspaceDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(WORKSPACE_DB_NAME, 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(WORKSPACE_STORE_NAME)) {
        db.createObjectStore(WORKSPACE_STORE_NAME);
      }
    };
  });
}

async function persistWorkspaceHandle(handle: FileSystemDirectoryHandle | null) {
  try {
    const db = await openWorkspaceDb();
    const tx = db.transaction(WORKSPACE_STORE_NAME, "readwrite");
    const store = tx.objectStore(WORKSPACE_STORE_NAME);
    if (handle) {
      store.put(handle, "current");
    } else {
      store.delete("current");
    }
  } catch {
    // Ignorerer fejl – persistence er kun en bekvemmelighed.
  }
}

async function restoreWorkspaceHandle(): Promise<FileSystemDirectoryHandle | null> {
  try {
    const db = await openWorkspaceDb();
    const tx = db.transaction(WORKSPACE_STORE_NAME, "readonly");
    const store = tx.objectStore(WORKSPACE_STORE_NAME);
    const request = store.get("current");
    return await new Promise<FileSystemDirectoryHandle | null>((resolve, reject) => {
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        resolve((request.result as FileSystemDirectoryHandle | undefined) ?? null);
      };
    });
  } catch {
    return null;
  }
}

function formatDate(value: string | null) {
  if (!value) return "Ingen frist";
  return new Date(value).toLocaleDateString("da-DK");
}

function isOverdue(value: string | null) {
  return Boolean(value && new Date(value) < new Date(new Date().toDateString()));
}

export default function App() {
  const [workspace, setWorkspace] = useState<WorkspaceHandle>(null);
  const [workspaceName, setWorkspaceName] = useState("");
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [tasksByProject, setTasksByProject] = useState<Record<string, TaskRecord[]>>({});
  const [selectedProjectSlug, setSelectedProjectSlug] = useState("");
  const [selectedTaskId, setSelectedTaskId] = useState("");
  const [dragTaskId, setDragTaskId] = useState("");
  const [panelDraft, setPanelDraft] = useState<PanelDraft>(EMPTY_DRAFT);
  const [newProjectName, setNewProjectName] = useState("");
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskAssignee, setNewTaskAssignee] = useState("");
  const [newTaskProjectSlug, setNewTaskProjectSlug] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [assigneeFilter, setAssigneeFilter] = useState("");
  const [commentText, setCommentText] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const hasWorkspace = Boolean(workspace);
  const [taskJustSaved, setTaskJustSaved] = useState(false);
  const [showTour, setShowTour] = useState(false);
  const [tourStep, setTourStep] = useState<1 | 2 | 3>(1);
  const [startTourAfterWorkspace, setStartTourAfterWorkspace] = useState(false);
  const [confirmState, setConfirmState] = useState<{
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    onConfirm: () => void | Promise<void>;
  } | null>(null);

  useEffect(() => {
    void (async () => {
      if (workspace) return;
      const restored = await restoreWorkspaceHandle();
      if (!restored) return;
      try {
        await loadAllData(restored);
        setWorkspace(restored);
        setWorkspaceName(restored.name);
      } catch (caught) {
        console.error("Kunne ikke genskabe arbejdsmappe", caught);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadAllData(
    handle: FileSystemDirectoryHandle,
    preferredProjectSlug?: string,
    preferredTaskId?: string | null,
  ) {
    const nextProjects = await listProjects(handle);
    const entries = await Promise.all(
      nextProjects.map(async (project) => [project.slug, await listTasks(handle, project.slug)] as const),
    );
    const nextTasksByProject = Object.fromEntries(entries);
    const projectSlug = preferredProjectSlug && nextProjects.some((p) => p.slug === preferredProjectSlug)
      ? preferredProjectSlug
      : nextProjects[0]?.slug ?? "";
    const availableTasks = projectSlug ? nextTasksByProject[projectSlug] ?? [] : [];
    const taskId =
      preferredTaskId === null
        ? ""
        : preferredTaskId && availableTasks.some((task) => task.id === preferredTaskId)
          ? preferredTaskId
          : "";

    setProjects(nextProjects);
    setTasksByProject(nextTasksByProject);
    setSelectedProjectSlug(projectSlug);
    setSelectedTaskId(taskId);
  }

  const selectedTask = useMemo(() => {
    const allTasks = Object.values(tasksByProject).flat();
    return allTasks.find((task) => task.id === selectedTaskId) ?? null;
  }, [selectedTaskId, tasksByProject]);

  useEffect(() => {
    if (!selectedTask) {
      setPanelDraft(EMPTY_DRAFT);
      return;
    }
    setPanelDraft({
      title: selectedTask.title,
      description: selectedTask.description,
      assignee: selectedTask.assignee,
      deadline: selectedTask.deadline ?? "",
      priority: selectedTask.priority,
      projectSlug: selectedTask.projectSlug,
      status: selectedTask.status,
    });
  }, [selectedTask]);

  const visibleTasks = useMemo(() => {
    const tasks = selectedProjectSlug ? tasksByProject[selectedProjectSlug] ?? [] : [];
    return tasks.filter((task) => {
      if (search && !`${task.title} ${task.description} ${task.assignee}`.toLowerCase().includes(search.toLowerCase())) return false;
      if (priorityFilter && task.priority !== priorityFilter) return false;
      if (assigneeFilter && task.assignee !== assigneeFilter) return false;
      return true;
    });
  }, [assigneeFilter, priorityFilter, search, selectedProjectSlug, tasksByProject]);

  const assignees = useMemo(() => {
    const values = new Set(Object.values(tasksByProject).flat().map((task) => task.assignee.trim()).filter(Boolean));
    return [...values].sort((a, b) => a.localeCompare(b));
  }, [tasksByProject]);

  const filtersActive = Boolean(priorityFilter || assigneeFilter);

  const activeProjects = useMemo(
    () => projects.filter((project) => !project.archived),
    [projects],
  );
  const archivedProjects = useMemo(
    () => projects.filter((project) => project.archived),
    [projects],
  );

  useEffect(() => {
    if (!message) return;
    const timerId = window.setTimeout(() => {
      setMessage("");
    }, 5000);
    return () => window.clearTimeout(timerId);
  }, [message]);

  useEffect(() => {
    if (!taskJustSaved) return;
    const timerId = window.setTimeout(() => {
      setTaskJustSaved(false);
    }, 3000);
    return () => window.clearTimeout(timerId);
  }, [taskJustSaved]);

  useEffect(() => {
    function handleKeydown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setSelectedTaskId("");
      }
      if (event.key === "Enter" && event.ctrlKey) {
        if (selectedTask && !busy && panelDraft.title.trim() && panelDraft.projectSlug) {
          event.preventDefault();
          void handleSaveTask();
        }
      }
    }

    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [selectedTask, busy, panelDraft.title, panelDraft.projectSlug]);

  async function runAction(action: () => Promise<void>, successMessage?: string) {
    try {
      setBusy(true);
      setError("");
      await action();
      if (successMessage) setMessage(successMessage);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Noget gik galt.");
    } finally {
      setBusy(false);
    }
  }

  async function requireWorkspace() {
    if (!workspace) throw new Error("Vælg en arbejdsmappe først.");
    return workspace;
  }

  function resetFilters() {
    setSearch("");
    setPriorityFilter("");
    setAssigneeFilter("");
    setShowFilters(false);
  }

  async function pickWorkspaceAndLoad() {
    await runAction(async () => {
      let handle: FileSystemDirectoryHandle;
      try {
        handle = await pickWorkspaceDirectory();
      } catch (caught) {
        if (caught instanceof DOMException && caught.name === "AbortError") {
          return;
        }
        throw caught;
      }
      setWorkspace(handle);
      setWorkspaceName(handle.name);
      await persistWorkspaceHandle(handle);
      await loadAllData(handle);
      setMessage("Arbejdsmappe valgt.");
      if (startTourAfterWorkspace) {
        setShowTour(true);
        setTourStep(1);
      }
    });
  }

  async function handlePickWorkspace() {
    if (workspace) {
      setConfirmState({
        title: "Skift arbejdsmappe",
        message:
          "Når du skifter arbejdsmappe, ser du kun projekter og opgaver fra den nye mappe. De gamle data bliver liggende i den tidligere mappe.",
        confirmLabel: "Skift arbejdsmappe",
        cancelLabel: "Behold nuværende",
        onConfirm: async () => {
          await pickWorkspaceAndLoad();
          setConfirmState(null);
        },
      });
      return;
    }
    await pickWorkspaceAndLoad();
  }

  async function handleCreateProject(name: string) {
    const trimmed = name.trim();
    if (!trimmed) return;
    await runAction(async () => {
      const handle = await requireWorkspace();
      const project = await createProject(handle, { name: trimmed });
      setNewProjectName("");
      await loadAllData(handle, project.slug);
    }, "Projekt oprettet.");
  }

  async function handleCreateTask(event: FormEvent) {
    event.preventDefault();
    const targetProjectSlug = newTaskProjectSlug || selectedProjectSlug;
    if (!newTaskTitle.trim() || !targetProjectSlug) {
      setError("Vælg projekt og skriv en titel.");
      return;
    }
    await runAction(async () => {
      const handle = await requireWorkspace();
      const task = await createTask(handle, targetProjectSlug, {
        title: newTaskTitle,
        assignee: newTaskAssignee,
      });
      setNewTaskTitle("");
      setNewTaskAssignee("");
      setNewTaskProjectSlug("");
      setIsCreatingTask(false);
      resetFilters();
      await loadAllData(handle, targetProjectSlug, task.id);
    }, "Opgave oprettet.");
  }

  async function handleSaveTask() {
    if (!selectedTask) return;
    if (!panelDraft.title.trim() || !panelDraft.projectSlug) {
      setError("Titel og projekt er påkrævet.");
      return;
    }
    await runAction(async () => {
      const handle = await requireWorkspace();
      let targetProjectSlug = panelDraft.projectSlug;
      let targetTaskId = selectedTask.id;

      if (panelDraft.projectSlug !== selectedTask.projectSlug) {
        const movedTask = await moveTaskToProject(handle, selectedTask.projectSlug, selectedTask.id, {
          targetProjectSlug: panelDraft.projectSlug,
          status: panelDraft.status,
        });
        targetProjectSlug = movedTask.projectSlug;
        targetTaskId = movedTask.id;
      }

      const updated = await updateTask(handle, targetProjectSlug, targetTaskId, {
        title: panelDraft.title,
        description: panelDraft.description,
        assignee: panelDraft.assignee,
        deadline: panelDraft.deadline || null,
        priority: panelDraft.priority,
        status: panelDraft.status,
      });

      if (commentText.trim()) {
        await addComment(handle, updated.projectSlug, updated.id, commentText.trim());
        setCommentText("");
      }

      await loadAllData(handle, updated.projectSlug, updated.id);
      setSelectedTaskId("");
      setTaskJustSaved(true);
    }, undefined);
  }

  async function handleProjectUpdate(project: ProjectRecord, updates: Partial<ProjectRecord>) {
    await runAction(async () => {
      const handle = await requireWorkspace();
      const updated = await updateProject(handle, project.slug, updates);
      await loadAllData(handle, updated.slug, selectedTaskId);
    }, "Projekt gemt.");
  }

  async function handleProjectDelete(project: ProjectRecord) {
    setConfirmState({
      title: "Slet projekt",
      message: `Er du sikker på, at du vil slette projektet "${project.name}"? Alle opgaver i projektet bliver også slettet.`,
      confirmLabel: "Slet projekt",
      cancelLabel: "Annuller",
      onConfirm: async () => {
        await runAction(async () => {
          const handle = await requireWorkspace();
          await deleteProject(handle, project.slug);
          const remainingProjects = projects.filter((entry) => entry.slug !== project.slug);
          const nextSelectedProjectSlug =
            selectedProjectSlug === project.slug ? (remainingProjects[0]?.slug ?? "") : selectedProjectSlug;
          const nextTasksByProject = Object.fromEntries(
            Object.entries(tasksByProject).filter(([slug]) => slug !== project.slug),
          );
          const nextSelectedTaskId =
            selectedTask?.projectSlug === project.slug
              ? ""
              : selectedTaskId;

          setProjects(remainingProjects);
          setTasksByProject(nextTasksByProject);
          setSelectedProjectSlug(nextSelectedProjectSlug);
          setSelectedTaskId(nextSelectedTaskId);

          await loadAllData(handle, nextSelectedProjectSlug || undefined, nextSelectedTaskId || null);
        }, "Projekt slettet.");
        setConfirmState(null);
      },
    });
  }

  async function handleAttachmentChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!selectedTask || !file) return;
    await runAction(async () => {
      const handle = await requireWorkspace();
      await addAttachment(handle, selectedTask.projectSlug, selectedTask.id, file);
      await loadAllData(handle, selectedTask.projectSlug, selectedTask.id);
    }, "Vedhæftning gemt.");
    event.target.value = "";
  }

  async function handleAttachmentOpen(fileId: string) {
    if (!selectedTask) return;
    const attachment = selectedTask.attachments.find((entry) => entry.id === fileId);
    if (!attachment) return;
    await runAction(async () => {
      const handle = await requireWorkspace();
      const file = await readAttachmentFile(handle, selectedTask.projectSlug, selectedTask.id, attachment.storedName);
      const url = URL.createObjectURL(file);
      window.open(url, "_blank", "noopener,noreferrer");
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    });
  }

  async function handleAttachmentDelete(fileId: string) {
    if (!selectedTask) return;
    const task = selectedTask;
    const attachment = task.attachments.find((entry) => entry.id === fileId);
    if (!attachment) return;
    setConfirmState({
      title: "Slet vedhæftning",
      message: `Vil du slette filen "${attachment.fileName}" fra denne opgave?`,
      confirmLabel: "Slet fil",
      cancelLabel: "Annuller",
      onConfirm: async () => {
        await runAction(async () => {
          const handle = await requireWorkspace();
          await deleteAttachment(handle, task.projectSlug, task.id, fileId);
          await loadAllData(handle, task.projectSlug, task.id);
        }, "Vedhæftning slettet.");
        setConfirmState(null);
      },
    });
  }

  async function handleTaskDelete() {
    if (!selectedTask) return;
    const task = selectedTask;
    setConfirmState({
      title: "Slet opgave",
      message: `Er du sikker på, at du vil slette opgaven "${task.title}"?`,
      confirmLabel: "Slet opgave",
      cancelLabel: "Annuller",
      onConfirm: async () => {
        await runAction(async () => {
          const handle = await requireWorkspace();
          await deleteTask(handle, task.projectSlug, task.id);
          await loadAllData(handle, task.projectSlug, null);
          setSelectedTaskId("");
        }, "Opgave slettet.");
        setConfirmState(null);
      },
    });
  }

  async function handleTaskDrop(taskId: string, nextStatus: TaskStatus) {
    const allTasks = Object.values(tasksByProject).flat();
    const task = allTasks.find((entry) => entry.id === taskId);
    if (!task || task.status === nextStatus) return;

    await runAction(async () => {
      const handle = await requireWorkspace();
      await updateTask(handle, task.projectSlug, task.id, { status: nextStatus });
      await loadAllData(handle, task.projectSlug, task.id);
    });
  }

  return (
    <div className="app-root">
      <header className="app-header">
        <div className="app-header-main" />
        <div className="app-header-toolbar">
          {error ? <div className="error-banner">{error}</div> : null}
          {message ? <div className="notice-banner">{message}</div> : null}
        </div>
      </header>

      <div className={`app-shell ${selectedTask ? "" : "without-task-panel"}`}>
        <aside className="left-rail">
          <div className="app-brand">
            <span className="app-brand-name">AIPOPS Workboard</span>
            <p className="muted small">Opgaver og projekter</p>
          </div>
          {hasWorkspace ? (
            <>
              <div className="workspace-card">
                <p className="eyebrow">Arbejdsmappe</p>
                <p
                  className="workspace-name"
                  title={workspaceName || undefined}
                >
                  {workspaceName || "Ingen mappe valgt"}
                </p>
                <button
                  type="button"
                  className="primary-button workspace-switch"
                  onClick={handlePickWorkspace}
                  disabled={busy}
                >
                  {workspaceName ? "Skift mappe" : "Vælg mappe"}
                </button>
              </div>

              <div className="workspace-card projects-card">
                <div className="projects-head-row">
                  <div>
                    <p className="eyebrow">Projekter</p>
                    <p className="muted small">
                      Vælg et projekt for at se opgaverne.
                    </p>
                    <button
                      type="button"
                      className="primary-button new-project-button"
                      disabled={busy || !hasWorkspace}
                      onClick={() => {
                        const name = window.prompt("Navn på projekt");
                        if (!name || !name.trim()) return;
                        void handleCreateProject(name);
                      }}
                    >
                      + Nyt projekt
                    </button>
                  </div>
                </div>

                <div className="project-list">
                  <p className="project-section-label">Aktive projekter</p>
                  {activeProjects.map((project) => (
                    <button
                      key={project.id}
                      type="button"
                      className={`project-list-item ${
                        selectedProjectSlug === project.slug ? "project-list-item-active" : ""
                      }`}
                      onClick={() => setSelectedProjectSlug(project.slug)}
                    >
                      <span className="project-list-text">
                        <span className="project-list-name">{project.name}</span>
                        {selectedProjectSlug === project.slug && (
                          <span className="project-list-meta">Aktivt projekt</span>
                        )}
                      </span>
                    </button>
                  ))}
                  {!activeProjects.length ? (
                    <p className="muted small">
                      Ingen aktive projekter endnu. Opret et nyt for at komme i gang.
                    </p>
                  ) : null}

                  {archivedProjects.length ? (
                    <>
                      <p className="project-section-label">Arkiverede projekter</p>
                      {archivedProjects.map((project) => (
                        <button
                          key={project.id}
                          type="button"
                          className={`project-list-item ${
                            selectedProjectSlug === project.slug ? "project-list-item-active" : ""
                          }`}
                          onClick={() => setSelectedProjectSlug(project.slug)}
                        >
                          <span className="project-list-text">
                            <span className="project-list-name">{project.name}</span>
                          </span>
                        </button>
                      ))}
                    </>
                  ) : null}
                  {projects.length > 0 && selectedProjectSlug && (
                    <button
                      type="button"
                      className="ghost-button danger-button project-delete-button"
                      onClick={() => {
                        const project = projects.find((entry) => entry.slug === selectedProjectSlug);
                        if (project) {
                          void handleProjectDelete(project);
                        }
                      }}
                    >
                      Slet projekt
                    </button>
                  )}
                </div>
              </div>
            </>
          ) : null}
        </aside>

        <main className="main-area">
          {hasWorkspace ? (
            <>
              <div className="toolbar">
                <div className="toolbar-row">
                  <div className="toolbar-search">
                    <input
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Søg i opgaver"
                    />
                  </div>
                  <div className="toolbar-actions">
                    <button
                      type="button"
                      className="ghost-button"
                      onClick={() => setShowFilters((current) => !current)}
                    >
                      Filtre
                      {filtersActive && (
                        <span className="filter-badge">●</span>
                      )}
                    </button>
                    <button
                      type="button"
                      className="primary-button"
                      disabled={busy || !projects.length}
                      onClick={() => {
                        setIsCreatingTask(true);
                        setNewTaskProjectSlug(selectedProjectSlug || projects[0]?.slug || "");
                      }}
                    >
                      Ny opgave
                    </button>
                  </div>
                </div>

                {showFilters ? (
                  <div className="filter-panel">
                    <select
                      value={priorityFilter}
                      onChange={(event) => setPriorityFilter(event.target.value)}
                    >
                      <option value="">Alle prioriteter</option>
                      {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                    <select
                      value={assigneeFilter}
                      onChange={(event) => setAssigneeFilter(event.target.value)}
                    >
                      <option value="">Alle ansvarlige</option>
                      {assignees.map((assignee) => (
                        <option key={assignee} value={assignee}>
                          {assignee}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="ghost-button"
                      onClick={resetFilters}
                    >
                      Nulstil
                    </button>
                  </div>
                ) : null}

                {filtersActive && (
                  <p className="muted small">
                    Filtre er aktive. Brug &quot;Nulstil&quot; for at se alle opgaver igen.
                  </p>
                )}

                {isCreatingTask ? (
                  <form className="new-task-panel" onSubmit={handleCreateTask}>
                    <label>
                      <span className="field-label">
                        Titel <span className="required-mark">*</span>
                      </span>
                      <input
                        value={newTaskTitle}
                        onChange={(event) => setNewTaskTitle(event.target.value)}
                        className={!newTaskTitle.trim() ? "input-invalid" : ""}
                        placeholder="Hvad skal gøres?"
                      />
                    </label>
                    <label>
                      <span className="field-label">
                        Projekt <span className="required-mark">*</span>
                      </span>
                      <select
                        value={newTaskProjectSlug}
                        onChange={(event) => setNewTaskProjectSlug(event.target.value)}
                      >
                        <option value="">
                          {workspace ? "Vælg projekt" : "Vælg arbejdsmappe først"}
                        </option>
                        {projects.map((project) => (
                          <option key={project.id} value={project.slug}>
                            {project.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Ansvarlig
                      <input
                        value={newTaskAssignee}
                        onChange={(event) => setNewTaskAssignee(event.target.value)}
                        placeholder="Navn (valgfrit)"
                      />
                    </label>
                    <div className="new-task-actions">
                      <button
                        type="button"
                        className="ghost-button"
                        onClick={() => {
                          setIsCreatingTask(false);
                          setNewTaskTitle("");
                          setNewTaskAssignee("");
                          setNewTaskProjectSlug("");
                        }}
                      >
                        Annuller
                      </button>
                      <button
                        type="submit"
                        className="primary-button"
                        disabled={busy || !newTaskTitle.trim()}
                      >
                        Opret opgave
                      </button>
                    </div>
                  </form>
                ) : null}
              </div>

              <section
                className="board"
                onClick={() => {
                  setSelectedTaskId("");
                }}
              >
                {visibleTasks.length === 0 ? (
                  <div className="board-empty">
                    <p>Ingen opgaver endnu.</p>
                    <p className="muted small">Brug &quot;Ny opgave&quot; for at tilføje den første.</p>
                  </div>
                ) : null}
                {(["backlog", "todo", "doing", "done"] as TaskStatus[]).map((status) => {
                  const tasks = visibleTasks.filter((task) => task.status === status);
                  return (
                    <div
                      key={status}
                      className="board-column"
                      onDragOver={(event) => {
                        event.preventDefault();
                      }}
                      onDrop={(event) => {
                        event.preventDefault();
                        const taskId = event.dataTransfer.getData("text/plain");
                        if (taskId) {
                          void handleTaskDrop(taskId, status);
                        }
                        setDragTaskId("");
                      }}
                    >
                      <div className="column-header">
                        <h2>{STATUS_LABELS[status]}</h2>
                        <span className="muted">{tasks.length}</span>
                      </div>
                      <div className="column-body">
                        {tasks.map((task) => {
                          const project = projects.find((entry) => entry.slug === task.projectSlug);
                          return (
                            <button
                              key={task.id}
                              type="button"
                              className={`task-card task-card-priority-${task.priority.toLowerCase()} ${
                                selectedTaskId === task.id ? "active" : ""
                              } ${dragTaskId === task.id ? "dragging" : ""}`}
                              onClick={(event) => {
                                event.stopPropagation();
                                setSelectedTaskId(task.id);
                              }}
                            >
                              <div className="row between tight task-card-top">
                                <span
                                  className="task-drag-handle"
                                  draggable
                                  onMouseDown={(event) => {
                                    event.stopPropagation();
                                  }}
                                  onDragStart={(event) => {
                                    event.stopPropagation();
                                    event.dataTransfer.setData("text/plain", task.id);
                                    setSelectedTaskId("");
                                    setDragTaskId(task.id);
                                  }}
                                >
                                  ☰
                                </span>
                                <strong className="task-title">{task.title}</strong>
                                <span
                                  className={`priority-pill priority-${task.priority.toLowerCase()}`}
                                >
                                  {PRIORITY_LABELS[task.priority]}
                                </span>
                              </div>
                              <div className="project-mark">
                                {project?.name ?? task.projectSlug}
                              </div>
                              <div className="task-card-meta">
                                <span className="muted">
                                  👤 {task.assignee || "Ingen ansvarlig"}
                                </span>
                                <span
                                  className={`deadline ${
                                    isOverdue(task.deadline) ? "overdue" : ""
                                  }`}
                                >
                                  🗓 {formatDate(task.deadline)}
                                </span>
                                {task.attachments.length > 0 && (
                                  <span className="task-chip">
                                    📎 {task.attachments.length}
                                  </span>
                                )}
                                {task.comments.length > 0 && (
                                  <span className="task-chip">
                                    💬 {task.comments.length}
                                  </span>
                                )}
                              </div>
                            </button>
                          );
                        })}
                        {!tasks.length ? (
                          <div className="muted">Ingen opgaver i denne kolonne.</div>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </section>
            </>
          ) : (
            <div className="empty-main">
              <div className="empty-main-card">
                <h2>Vælg en arbejdsmappe for at komme i gang</h2>
                <p className="muted">
                  AIPOPS Workboard gemmer alle projekter og opgaver lokalt i den mappe du vælger.
                </p>
                <label className="toggle tour-toggle">
                  <input
                    type="checkbox"
                    checked={startTourAfterWorkspace}
                    onChange={(event) => setStartTourAfterWorkspace(event.target.checked)}
                  />
                  Vis en kort rundtur efter valg
                </label>
                <button
                  type="button"
                  className="primary-button"
                  onClick={() => void handlePickWorkspace()}
                  disabled={busy}
                >
                  Vælg arbejdsmappe
                </button>
              </div>
            </div>
          )}
        </main>

        {selectedTask ? (
          <aside className="task-panel">
            <div className="row between">
              <p className="eyebrow">Opgavedetaljer</p>
              <button
                type="button"
                className="ghost-button small-button"
                onClick={() => setSelectedTaskId("")}
              >
                Luk
              </button>
            </div>
            <div>
              <div className="stack">
                <label>
                  <span className="field-label">
                    Titel <span className="required-mark">*</span>
                  </span>
                  <input
                    value={panelDraft.title}
                    onChange={(event) =>
                      setPanelDraft((current) => ({
                        ...current,
                        title: event.target.value,
                      }))
                    }
                    className={!panelDraft.title.trim() ? "input-invalid" : ""}
                  />
                </label>
                <label>
                  Beskrivelse
                  <textarea
                    rows={3}
                    value={panelDraft.description}
                    onChange={(event) =>
                      setPanelDraft((current) => ({
                        ...current,
                        description: event.target.value,
                      }))
                    }
                  />
                </label>
              </div>
            </div>

            <div>
              <p className="eyebrow">Basisinfo</p>
              <div className="panel-grid">
                <label>
                  Ansvarlig
                  <input
                    value={panelDraft.assignee}
                    onChange={(event) =>
                      setPanelDraft((current) => ({
                        ...current,
                        assignee: event.target.value,
                      }))
                    }
                  />
                </label>
                <label>
                  Frist
                  <input
                    type="date"
                    value={panelDraft.deadline}
                    onChange={(event) =>
                      setPanelDraft((current) => ({
                        ...current,
                        deadline: event.target.value,
                      }))
                    }
                  />
                </label>
                <label>
                  Prioritet
                  <select
                    value={panelDraft.priority}
                    onChange={(event) =>
                      setPanelDraft((current) => ({
                        ...current,
                        priority: event.target.value as TaskPriority,
                      }))
                    }
                  >
                    {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Status
                  <select
                    value={panelDraft.status}
                    onChange={(event) =>
                      setPanelDraft((current) => ({
                        ...current,
                        status: event.target.value as TaskStatus,
                      }))
                    }
                  >
                    {Object.entries(STATUS_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span className="field-label">
                    Projekt <span className="required-mark">*</span>
                  </span>
                  <select
                    value={panelDraft.projectSlug}
                    onChange={(event) =>
                      setPanelDraft((current) => ({
                        ...current,
                        projectSlug: event.target.value,
                      }))
                    }
                    className={!panelDraft.projectSlug ? "input-invalid" : ""}
                  >
                    <option value="">Vælg projekt</option>
                    {projects
                      .filter((project) => !project.archived)
                      .map((project) => (
                        <option key={project.id} value={project.slug}>
                          {project.name}
                        </option>
                      ))}
                  </select>
                </label>
              </div>
            </div>

            <div>
              <p className="eyebrow">Vedhæftninger</p>
              <label className="dropzone upload-button">
                Tilføj fil
                <input type="file" onChange={handleAttachmentChange} hidden />
              </label>
              <div className="stack">
                {selectedTask.attachments.map((attachment) => (
                  <div key={attachment.id} className="attachment-row">
                    <button
                      type="button"
                      className="ghost-button"
                      onClick={() => void handleAttachmentOpen(attachment.id)}
                    >
                      {attachment.fileName}
                    </button>
                    <button
                      type="button"
                      className="ghost-button danger-button"
                      onClick={() => void handleAttachmentDelete(attachment.id)}
                    >
                      Slet
                    </button>
                  </div>
                ))}
                {!selectedTask.attachments.length ? (
                  <div className="muted">Ingen vedhæftninger endnu.</div>
                ) : null}
              </div>
            </div>

            <div className="task-panel-footer">
              <p className="eyebrow">Kommentarer</p>
              <div className="stack">
                <textarea
                  rows={2}
                  value={commentText}
                  onChange={(event) => setCommentText(event.target.value)}
                  placeholder="Skriv en kommentar"
                />
              </div>
              <div className="stack">
                {selectedTask.comments.map((comment) => (
                  <div key={comment.id} className="comment-card">
                    <strong>{comment.text}</strong>
                    <span>
                      {new Date(comment.createdAt).toLocaleString("da-DK")}
                    </span>
                  </div>
                ))}
                {!selectedTask.comments.length ? (
                  <div className="muted">Ingen kommentarer endnu.</div>
                ) : null}
              </div>
            </div>

            <div className="task-panel-actions">
              <button
                type="button"
                className="ghost-button danger-button"
                onClick={() => void handleTaskDelete()}
                disabled={busy}
              >
                Slet opgave
              </button>
              <div>
                <button
                  type="button"
                  className="primary-button task-save-button"
                  onClick={() => void handleSaveTask()}
                  disabled={busy || !panelDraft.title.trim() || !panelDraft.projectSlug}
                >
                  Gem opgave
                </button>
                {taskJustSaved && (
                  <p className="muted small">Opgaven er gemt.</p>
                )}
              </div>
            </div>
          </aside>
        ) : null}
      </div>
      {showTour ? (
        <div className="tour-hint">
          <div className="tour-hint-card">
            <p className="tour-hint-title">
              {tourStep === 1 && "Trin 1 af 3 – Projekter"}
              {tourStep === 2 && "Trin 2 af 3 – Opgaver"}
              {tourStep === 3 && "Trin 3 af 3 – Boardet"}
            </p>
            <p className="tour-hint-text">
              {tourStep === 1 &&
                "I venstre side kan du oprette projekter. Start med at lave et projekt til dit arbejde eller et privat projekt."}
              {tourStep === 2 &&
                "Øverst over boardet kan du oprette nye opgaver med titel, projekt og ansvarlig."}
              {tourStep === 3 &&
                "Her på boardet kan du trække opgaver mellem kolonner og klikke på et kort for at se detaljer."}
            </p>
            <div className="tour-hint-actions">
              <button
                type="button"
                className="ghost-button"
                onClick={() => setShowTour(false)}
              >
                Spring over
              </button>
              <button
                type="button"
                className="primary-button"
                onClick={() => {
                  if (tourStep === 3) {
                    setShowTour(false);
                  } else {
                    setTourStep((step) => (step === 3 ? 3 : ((step + 1) as 1 | 2 | 3)));
                  }
                }}
              >
                {tourStep === 3 ? "Færdig" : "Næste"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
      {confirmState ? (
        <div className="confirm-modal-backdrop">
          <div className="confirm-modal">
            <h2>{confirmState.title}</h2>
            <p>{confirmState.message}</p>
            <div className="confirm-modal-actions">
              <button
                type="button"
                className="ghost-button"
                onClick={() => setConfirmState(null)}
              >
                {confirmState.cancelLabel ?? "Annuller"}
              </button>
              <button
                type="button"
                className="primary-button"
                onClick={async () => {
                  await confirmState.onConfirm();
                }}
              >
                {confirmState.confirmLabel ?? "OK"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
