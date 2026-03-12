// Page shell for AIPOPS Workboard.
// Denne komponent samler kun hooks og UI-komponenter – selve domænelogikken
// ligger i feature-hooks (tasks, projekter, workspace, async-feedback).
import { useEffect, useRef, useState } from "react";
import type { ProjectRecord, TaskRecord, TaskStatus } from "./types";
import { pickWorkspaceDirectory } from "./infrastructure/storage";
import { TaskBoard } from "./features/tasks/TaskBoard";
import { TaskDetailsPanel } from "./features/tasks/TaskDetailsPanel";
import { EMPTY_DRAFT, PanelDraft, isOverdue } from "./features/tasks/taskUi";
import { TaskToolbar } from "./features/tasks/TaskToolbar";
import { useTaskFilters } from "./features/tasks/useTaskFilters";
import { useTaskActions } from "./features/tasks/useTaskActions";
import { WorkspaceSidebar } from "./features/workspace/WorkspaceSidebar";
import { WorkspaceEmptyState } from "./features/workspace/WorkspaceEmptyState";
import { NewProjectModal } from "./features/workspace/NewProjectModal";
import { useProjectActions } from "./features/workspace/useProjectActions";
import { useWorkspace } from "./features/workspace/useWorkspace";
import { loadAllDataModel } from "./features/workspace/loadAllDataModel";
import { persistWorkspaceHandle, restoreWorkspaceHandle } from "./features/workspace/workspacePersistence";
import { AppHeader } from "./features/layout/AppHeader";
import { TourOverlay } from "./features/layout/TourOverlay";
import { ConfirmModal } from "./features/layout/ConfirmModal";
import { AppFooter } from "./features/layout/AppFooter";
import { AboutModal } from "./features/layout/AboutModal";
import { useAsyncFeedback } from "./features/layout/useAsyncFeedback";

type WorkspaceHandle = FileSystemDirectoryHandle | null;

export default function App() {
  // Central page-state:
  // - workspace/workspaceName: valgt mappe på brugerens disk
  // - projects/tasksByProject: domænedata læst fra filsystemet
  // - selectedProjectSlug/selectedTaskId: hvad der er aktivt i UI'et
  // - diverse UI-flags til filtre, formularer, modaler og turen.
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
  const [commentText, setCommentText] = useState("");
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
  const [showAbout, setShowAbout] = useState(false);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [isMobileLike, setIsMobileLike] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window === "undefined") return "light";
    try {
      const prefersDark =
        typeof window.matchMedia === "function" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches;
      return prefersDark ? "dark" : "light";
    } catch {
      return "light";
    }
  });

  // Async-feedback (busy/error/message) deles af alle domæne-handlers via runAction.
  const { busy, error, message, setError, setMessage, runAction } = useAsyncFeedback();

  // Synkroniser valgt tema til body-klasse så CSS kan lave overrides.
  useEffect(() => {
    document.body.classList.toggle("theme-dark", theme === "dark");
  }, [theme]);

  // Enkel detektion af "mobil-lignende" view (lille viewport og typisk touch).
  useEffect(() => {
    function evaluateMobileLike() {
      const width = window.innerWidth;
      const isNarrow = width < 900;
      const prefersCoarse =
        typeof window.matchMedia === "function"
          ? window.matchMedia("(pointer: coarse)").matches
          : false;
      setIsMobileLike(isNarrow && prefersCoarse);
    }

    evaluateMobileLike();
    window.addEventListener("resize", evaluateMobileLike);
    return () => window.removeEventListener("resize", evaluateMobileLike);
  }, []);

  // Ved første render forsøger vi at gendanne seneste arbejdsmappe
  // og loade projekter/opgaver derfra.
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

  // Loader projekter + tasks fra filsystemet og opdaterer hele view-modellen
  // via den fælles loadAllDataModel-helper.
  async function loadAllData(
    handle: FileSystemDirectoryHandle,
    preferredProjectSlug?: string,
    preferredTaskId?: string | null,
  ) {
    const model = await loadAllDataModel(handle, preferredProjectSlug, preferredTaskId);
    setProjects(model.projects);
    setTasksByProject(model.tasksByProject);
    setSelectedProjectSlug(model.selectedProjectSlug);
    setSelectedTaskId(model.selectedTaskId);
  }

  // Sikrer at der er valgt en arbejdsmappe, ellers kastes en fejl
  // (til brug i runAction).
  async function requireWorkspace() {
    if (!workspace) throw new Error("Vælg en arbejdsmappe først.");
    return workspace;
  }

  const {
    search,
    setSearch,
    priorityFilter,
    setPriorityFilter,
    assigneeFilter,
    setAssigneeFilter,
    showFilters,
    setShowFilters,
    visibleTasks,
    assignees,
    filtersActive,
    resetFilters,
  } = useTaskFilters({ tasksByProject, selectedProjectSlug });

  const totalVisibleTasks = visibleTasks.length;
  const overdueVisibleTasks = visibleTasks.filter((task) => isOverdue(task.deadline)).length;
  const todayLabel = new Date().toDateString();
  const dueTodayVisibleTasks = visibleTasks.filter(
    (task) => task.deadline && new Date(task.deadline).toDateString() === todayLabel,
  ).length;
  const doingVisibleTasks = visibleTasks.filter((task) => task.status === "doing").length;
   const doneVisibleTasks = visibleTasks.filter((task) => task.status === "done").length;
  const highPriorityVisibleTasks = visibleTasks.filter(
    (task) => task.priority === "High" || task.priority === "Critical",
  ).length;

  const {
    selectedTask,
    handleCreateTask,
    handleSaveTask,
    handleAttachmentChange,
    handleAttachmentOpen,
    handleAttachmentDelete,
    handleTaskDelete,
    handleTaskDrop,
  } = useTaskActions({
    projects,
    tasksByProject,
    selectedProjectSlug,
    selectedTaskId,
    panelDraft,
    setPanelDraft,
    newTaskTitle,
    setNewTaskTitle,
    newTaskAssignee,
    setNewTaskAssignee,
    newTaskProjectSlug,
    setNewTaskProjectSlug,
    isCreatingTask,
    setIsCreatingTask,
    commentText,
    setCommentText,
    setTaskJustSaved,
    resetFilters,
    requireWorkspace,
    runAction,
    loadAllData,
    setError,
    setSelectedTaskId,
    setDragTaskId,
    setConfirmState,
  });

  const {
    activeProjects,
    archivedProjects,
    handleCreateProject,
    handleProjectUpdate,
    handleProjectDelete,
  } = useProjectActions({
    projects,
    tasksByProject,
    selectedProjectSlug,
    selectedTask,
    selectedTaskId,
    requireWorkspace,
    runAction,
    loadAllData,
    setProjects,
    setTasksByProject,
    setSelectedProjectSlug,
    setSelectedTaskId,
    setConfirmState,
    setNewProjectName,
  });

  const {
    hasWorkspace,
    pickWorkspaceAndLoad,
    handleRefreshData,
    handlePickWorkspace,
  } = useWorkspace({
    workspace,
    setWorkspace,
    workspaceName,
    setWorkspaceName,
    selectedProjectSlug,
    selectedTaskId,
    startTourAfterWorkspace,
    setShowTour,
    setTourStep,
    runAction,
    requireWorkspace,
    loadAllData,
    setMessage,
    setConfirmState,
    persistWorkspaceHandle,
    pickWorkspaceDirectory,
  });

  // Auto-skjul besked-banneret efter et par sekunder.
  useEffect(() => {
    if (!message) return;
    const timerId = window.setTimeout(() => {
      setMessage("");
    }, 5000);
    return () => window.clearTimeout(timerId);
  }, [message]);

  // "Opgaven er gemt"-indikator nulstilles automatisk efter kort tid.
  useEffect(() => {
    if (!taskJustSaved) return;
    const timerId = window.setTimeout(() => {
      setTaskJustSaved(false);
    }, 3000);
    return () => window.clearTimeout(timerId);
  }, [taskJustSaved]);

  // Global tastatur-genveje:
  // - Escape: lukker About-modal eller detaljer-panel.
  // - Ctrl+Enter: gemmer opgave, hvis formularen er gyldig.
  useEffect(() => {
    function handleKeydown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        if (showAbout) setShowAbout(false);
        else setSelectedTaskId("");
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
  }, [selectedTask, busy, panelDraft.title, panelDraft.projectSlug, showAbout]);

  return (
    <div className="app-root">
      {isMobileLike ? (
        <div className="mobile-warning-backdrop">
          <div className="mobile-warning-card">
            <h1 className="mobile-warning-title">AIPOPS Workboard virker bedst på en computer</h1>
            <p className="mobile-warning-text">
              Dette board er designet til større skærme. Åbn siden på en bærbar eller desktop for
              at arbejde med dine projekter og opgaver.
            </p>
          </div>
        </div>
      ) : null}

      <AppHeader error={error} message={message} />

      <div className={`app-shell ${selectedTask ? "" : "without-task-panel"}`}>
        <WorkspaceSidebar
          hasWorkspace={hasWorkspace}
          workspaceName={workspaceName}
          busy={busy}
          projects={projects}
          activeProjects={activeProjects}
          archivedProjects={archivedProjects}
          selectedProjectSlug={selectedProjectSlug}
          onPickWorkspace={() => void handlePickWorkspace()}
          onRefreshData={() => void handleRefreshData()}
          onCreateProject={() => setShowNewProjectModal(true)}
          onSelectProject={(slug) => setSelectedProjectSlug(slug)}
          onDeleteProject={(project) => void handleProjectDelete(project)}
        />

        <main className="main-area">
          {hasWorkspace ? (
            <>
              <TaskToolbar
                hasWorkspace={hasWorkspace}
                projects={projects}
                selectedProjectSlug={selectedProjectSlug}
                search={search}
                onSearchChange={(value) => setSearch(value)}
                showFilters={showFilters}
                onToggleFilters={() => setShowFilters((current) => !current)}
                filtersActive={filtersActive}
                priorityFilter={priorityFilter}
                assigneeFilter={assigneeFilter}
                onPriorityFilterChange={(value) => setPriorityFilter(value)}
                onAssigneeFilterChange={(value) => setAssigneeFilter(value)}
                assignees={assignees}
                onResetFilters={resetFilters}
                isCreatingTask={isCreatingTask}
                busy={busy}
                theme={theme}
                onToggleTheme={() => setTheme((current) => (current === "light" ? "dark" : "light"))}
                totalVisibleTasks={totalVisibleTasks}
                overdueVisibleTasks={overdueVisibleTasks}
                dueTodayVisibleTasks={dueTodayVisibleTasks}
                doingVisibleTasks={doingVisibleTasks}
                doneVisibleTasks={doneVisibleTasks}
                highPriorityVisibleTasks={highPriorityVisibleTasks}
                newTaskTitle={newTaskTitle}
                newTaskAssignee={newTaskAssignee}
                newTaskProjectSlug={newTaskProjectSlug}
                onNewTaskTitleChange={(value) => setNewTaskTitle(value)}
                onNewTaskAssigneeChange={(value) => setNewTaskAssignee(value)}
                onNewTaskProjectSlugChange={(value) => setNewTaskProjectSlug(value)}
                onOpenNewTask={() => {
                  setIsCreatingTask(true);
                  setNewTaskProjectSlug(selectedProjectSlug || projects[0]?.slug || "");
                }}
                onCancelNewTask={() => {
                  setIsCreatingTask(false);
                  setNewTaskTitle("");
                  setNewTaskAssignee("");
                  setNewTaskProjectSlug("");
                }}
                onSubmitNewTask={handleCreateTask}
              />

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
                <TaskBoard
                  tasks={visibleTasks}
                  projects={projects}
                  selectedTaskId={selectedTaskId}
                  dragTaskId={dragTaskId}
                  onTaskSelect={(taskId) => setSelectedTaskId(taskId)}
                  onTaskDrop={(taskId, status) => void handleTaskDrop(taskId, status)}
                  onTaskDragStart={(taskId) => {
                    setSelectedTaskId("");
                    setDragTaskId(taskId);
                  }}
                  onTaskDragEnd={() => setDragTaskId("")}
                />
              </section>
            </>
          ) : (
            <WorkspaceEmptyState
              startTourAfterWorkspace={startTourAfterWorkspace}
              busy={busy}
              onStartTourToggle={(checked) => setStartTourAfterWorkspace(checked)}
              onPickWorkspace={() => void handlePickWorkspace()}
            />
          )}
        </main>

        {selectedTask ? (
          <TaskDetailsPanel
            task={selectedTask}
            projects={projects}
            draft={panelDraft}
            commentText={commentText}
            busy={busy}
            taskJustSaved={taskJustSaved}
            onClose={() => setSelectedTaskId("")}
            onDraftChange={(draft) => setPanelDraft(draft)}
            onCommentTextChange={(value) => setCommentText(value)}
            onSave={() => void handleSaveTask()}
            onDelete={() => void handleTaskDelete()}
            onAttachmentChange={handleAttachmentChange}
            onAttachmentOpen={(id) => void handleAttachmentOpen(id)}
            onAttachmentDelete={(id) => void handleAttachmentDelete(id)}
          />
        ) : null}
      </div>

      {showTour ? (
        <TourOverlay
          tourStep={tourStep}
          onSkip={() => setShowTour(false)}
          onNext={() => {
            if (tourStep === 3) {
              setShowTour(false);
            } else {
              setTourStep((step) => (step === 3 ? 3 : ((step + 1) as 1 | 2 | 3)));
            }
          }}
        />
      ) : null}

      {confirmState ? (
        <ConfirmModal
          title={confirmState.title}
          message={confirmState.message}
          confirmLabel={confirmState.confirmLabel}
          cancelLabel={confirmState.cancelLabel}
          onCancel={() => setConfirmState(null)}
          onConfirm={confirmState.onConfirm}
        />
      ) : null}

      <NewProjectModal
        open={showNewProjectModal}
        value={newProjectName}
        busy={busy}
        onChange={(value) => setNewProjectName(value)}
        onCancel={() => {
          setShowNewProjectModal(false);
          setNewProjectName("");
        }}
        onCreate={() => {
          void handleCreateProject(newProjectName);
          setShowNewProjectModal(false);
        }}
      />

      <AppFooter onShowAbout={() => setShowAbout(true)} />
      <AboutModal show={showAbout} onClose={() => setShowAbout(false)} />
    </div>
  );
}
