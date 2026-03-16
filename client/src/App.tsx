// Page shell for AIPOPS Workboard.
// Denne komponent samler kun hooks og UI-komponenter – selve domænelogikken
// ligger i feature-hooks (tasks, projekter, workspace, async-feedback).
import { useEffect, useRef, useState } from "react";
import type { ProjectRecord, TaskRecord, TaskStatus } from "./types";
import { loadConfig, pickWorkspaceDirectory, saveConfig, createTask, updateTask } from "./infrastructure/storage";
import { SplitTasksModal } from "./features/tasks/SplitTasksModal";
import { EMPTY_DRAFT, PanelDraft, isOverdue } from "./features/tasks/taskUi";
import { useTaskFilters } from "./features/tasks/useTaskFilters";
import { useTaskActions } from "./features/tasks/useTaskActions";
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
import { AiSettingsModal } from "./features/layout/AiSettingsModal";
import { MorningBriefModal } from "./features/layout/MorningBriefModal";
import { useAiFeatures } from "./features/layout/useAiFeatures";
import { WorkspaceShell } from "./features/layout/WorkspaceShell";
import { buildWorkspaceViewModel } from "./features/workspace/workspaceViewModel";

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
  const [newTaskDescription, setNewTaskDescription] = useState("");
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
  const [showDataHelp, setShowDataHelp] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [isMobileLike, setIsMobileLike] = useState(false);
  const [aiApiKey, setAiApiKey] = useState<string | null>(null);
  const [showAiSetup, setShowAiSetup] = useState(false);
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

  // Når der er en aktiv arbejdsmappe, forsøger vi at læse konfigurationsfilen.
  // Herfra afgør vi bl.a., om AI er sat op for denne mappe.
  useEffect(() => {
    void (async () => {
      if (!workspace) {
        setAiApiKey(null);
        return;
      }
      const config = await loadConfig(workspace);
      const nextKey = config?.ai?.apiKey ?? null;
      setAiApiKey(nextKey);
      // Hvis der ikke er nogen nøgle og brugeren ikke tidligere er blevet præsenteret
      // for AI-opsætning for denne arbejdsmappe, viser vi en lille wizard.
      if (!nextKey && !config?.ai?.seenSetup) {
        setShowAiSetup(true);
      }
    })();
  }, [workspace]);

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

  const workspaceVm = buildWorkspaceViewModel(projects, tasksByProject);

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
    newTaskDescription,
    setNewTaskDescription,
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

  const {
    aiBusy,
    morningBrief,
    showMorningBrief,
    setShowMorningBrief,
    splitSuggestions,
    showSplitModal,
    setShowSplitModal,
    splitProjectSlug,
    canSplitCurrentDescription,
    setCanSplitCurrentDescription,
    canSplitNewTaskDescription,
    setCanSplitNewTaskDescription,
    handleMorningBrief,
    handleAiSuggestNewTaskDescription,
    handleAiSummarizeExisting,
    handleSplitFromDescription,
    handleSplitFromNewTaskDescription,
  } = useAiFeatures({
    aiApiKey,
    workspace: {
      projects,
      tasksByProject,
      activeProjects,
      selectedProjectSlug,
    },
    task: {
      selectedTask,
      panelDraft,
      setPanelDraft,
    },
    newTask: {
      title: newTaskTitle,
      description: newTaskDescription,
      projectSlug: newTaskProjectSlug,
      setDescription: setNewTaskDescription,
    },
    setMessage,
    runAction,
  });

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
      <AppHeader error={error} message={message} />

      <WorkspaceShell
        isMobileLike={isMobileLike}
        hasWorkspace={hasWorkspace}
        workspaceName={workspaceName}
        busy={busy}
        projects={projects}
        activeProjects={workspaceVm.activeProjects}
        archivedProjects={workspaceVm.archivedProjects}
        tasksByProject={tasksByProject}
        selectedProjectSlug={selectedProjectSlug}
        selectedTaskId={selectedTaskId}
        dragTaskId={dragTaskId}
        selectedTask={selectedTask}
        workspaceProgressLabel={workspaceVm.workspaceProgressLabel}
        workspaceProgressTooltip={workspaceVm.workspaceProgressTooltip}
        projectTooltips={workspaceVm.projectTooltips}
        projectTaskCounts={workspaceVm.projectTaskCounts}
        startTourAfterWorkspace={startTourAfterWorkspace}
        onStartTourToggle={(checked) => setStartTourAfterWorkspace(checked)}
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
        newTaskDescription={newTaskDescription}
        onNewTaskTitleChange={(value) => setNewTaskTitle(value)}
        onNewTaskAssigneeChange={(value) => setNewTaskAssignee(value)}
        onNewTaskProjectSlugChange={(value) => setNewTaskProjectSlug(value)}
        onNewTaskDescriptionChange={(value) => setNewTaskDescription(value)}
        aiBusy={aiBusy}
        aiLabel={
          aiApiKey && newTaskDescription.length > 120
            ? "✨ Ryd op fra mail/Teams"
            : "✨ Hjælp til beskrivelse"
        }
        canSplitNewTaskDescription={canSplitNewTaskDescription}
        onSplitNewTaskDescription={() => handleSplitFromNewTaskDescription(() => setShowAiSetup(true))}
        onAiSuggestNewTaskDescription={() => handleAiSuggestNewTaskDescription(() => setShowAiSetup(true))}
        onOpenNewTask={() => {
          setIsCreatingTask(true);
          setNewTaskProjectSlug(selectedProjectSlug || projects[0]?.slug || "");
          setCanSplitNewTaskDescription(false);
        }}
        onCancelNewTask={() => {
          setIsCreatingTask(false);
          setNewTaskTitle("");
          setNewTaskAssignee("");
          setNewTaskProjectSlug("");
          setNewTaskDescription("");
          setCanSplitNewTaskDescription(false);
        }}
        onSubmitNewTask={handleCreateTask}
        visibleTasks={visibleTasks}
        onTaskSelect={(taskId) => setSelectedTaskId(taskId)}
        onTaskDrop={(taskId, status) => void handleTaskDrop(taskId, status)}
        onTaskDragStart={(taskId) => {
          setSelectedTaskId("");
          setDragTaskId(taskId);
        }}
        onTaskDragEnd={() => setDragTaskId("")}
        panelDraft={panelDraft}
        commentText={commentText}
        taskJustSaved={taskJustSaved}
        canSplitFromDescription={canSplitCurrentDescription}
        onAiSummarizeDescription={() => handleAiSummarizeExisting(() => setShowAiSetup(true))}
        onOpenAiSettings={() => setShowAiSetup(true)}
        onSplitFromDescription={() => handleSplitFromDescription(() => setShowAiSetup(true))}
        onCloseDetails={() => setSelectedTaskId("")}
        onDraftChange={(draft) => setPanelDraft(draft)}
        onCommentTextChange={(value) => setCommentText(value)}
        onSaveTask={() => void handleSaveTask()}
        onDeleteTask={() => void handleTaskDelete()}
        onAttachmentChange={handleAttachmentChange}
        onAttachmentOpen={(id) => void handleAttachmentOpen(id)}
        onAttachmentDelete={(id) => void handleAttachmentDelete(id)}
        onShowMorningBrief={() => handleMorningBrief(() => setShowAiSetup(true))}
        onPickWorkspace={() => void handlePickWorkspace()}
        onRefreshData={() => void handleRefreshData()}
        onCreateProject={() => setShowNewProjectModal(true)}
        onSelectProject={(slug) => setSelectedProjectSlug(slug)}
        onDeleteProject={(project) => void handleProjectDelete(project)}
      />

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

      {showDataHelp ? (
        <ConfirmModal
          title="Hvordan gemmes og flyttes dine data?"
          className="confirm-modal-large"
          message={
            <>
              <p>
                AIPOPS Workboard gemmer alle projekter og opgaver som almindelige filer i den
                arbejdsmappe, du har valgt. Der er ingen skjult database eller server.
              </p>
              <ul>
                <li>
                  <strong>Skifte mappe på samme PC:</strong> Kopiér/ flyt hele arbejds­mappen til et
                  nyt sted, og klik derefter på &quot;Skift mappe&quot; i sidebaren og peg på den
                  nye placering.
                </li>
                <li>
                  <strong>Ny computer:</strong> Kopiér arbejds­mappen til den nye maskine (fx via
                  USB, OneDrive eller Git), og vælg den derefter som arbejdsmappe i AIPOPS
                  Workboard.
                </li>
                <li>
                  <strong>Flere workspaces:</strong> Du kan have flere mapper (fx arbejde/privat) og
                  skifte mellem dem med &quot;Skift mappe&quot;.
                </li>
              </ul>
              <p>
                Din AI‑nøgle gemmes også kun i arbejds­mappen. Flytter du mappen, følger
                AI‑opsætningen med.
              </p>
            </>
          }
          cancelLabel="Luk"
          confirmLabel="OK"
          onCancel={() => setShowDataHelp(false)}
          onConfirm={() => {
            setShowDataHelp(false);
          }}
        />
      ) : null}

      <SplitTasksModal
        open={showSplitModal}
        suggestions={splitSuggestions}
        canMarkOriginalDone={!!selectedTask}
        onCancel={() => setShowSplitModal(false)}
        onConfirm={(selected, { markOriginalDone }) => {
          void (async () => {
            if (!workspace || !splitProjectSlug) return;
            setShowSplitModal(false);
            await runAction(async () => {
              const handle = await requireWorkspace();
              const createdCount = selected.length;
              for (const item of selected) {
                await createTask(handle, splitProjectSlug, {
                  title: item.title,
                  assignee: "",
                  description: item.description,
                });
              }
              if (markOriginalDone && selectedTask && selectedTask.projectSlug === splitProjectSlug) {
                await updateTask(handle, splitProjectSlug, selectedTask.id, {
                  status: "done",
                } as Partial<TaskRecord>);
              }

              // Hvis vi kom fra "Ny opgave"-formularen (ingen valgt opgave),
              // luk og ryd kladden efter split, så brugeren ikke sidder tilbage
              // med en gammel mail-tekst.
              if (!selectedTask) {
                setIsCreatingTask(false);
                setNewTaskTitle("");
                setNewTaskAssignee("");
                setNewTaskProjectSlug("");
                setNewTaskDescription("");
              }

              await loadAllData(handle, splitProjectSlug, selectedTask?.id ?? null);
              if (markOriginalDone && selectedTask) {
                setMessage(
                  `${createdCount} opgave${createdCount === 1 ? "" : "r"} oprettet, og den oprindelige opgave er markeret som færdig.`,
                );
              } else {
                setMessage(
                  `${createdCount} opgave${createdCount === 1 ? "" : "r"} oprettet ud fra teksten.`,
                );
              }
            });
          })();
        }}
      />

      <MorningBriefModal
        open={showMorningBrief}
        brief={morningBrief}
        onClose={() => setShowMorningBrief(false)}
      />

      <AiSettingsModal
        open={showAiSetup}
        busy={busy}
        initialApiKey={aiApiKey}
        onRemove={async () => {
          setShowAiSetup(false);
          if (!workspace) return;
          const existing = (await loadConfig(workspace)) ?? {};
          await saveConfig(workspace, {
            ...existing,
            ai: {
              ...existing.ai,
              apiKey: undefined,
              seenSetup: true,
            },
          });
          setAiApiKey(null);
        }}
        onSkip={async () => {
          setShowAiSetup(false);
          if (!workspace) return;
          const existing = (await loadConfig(workspace)) ?? {};
          await saveConfig(workspace, {
            ...existing,
            ai: {
              ...existing.ai,
              seenSetup: true,
              apiKey: existing.ai?.apiKey,
            },
          });
        }}
        onSave={async (nextKey) => {
          setShowAiSetup(false);
          if (!workspace) return;
          const existing = (await loadConfig(workspace)) ?? {};
          await saveConfig(workspace, {
            ...existing,
            ai: {
              ...existing.ai,
              apiKey: nextKey ?? undefined,
              seenSetup: true,
            },
          });
          setAiApiKey(nextKey);
        }}
      />

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

      <AppFooter
        onShowAbout={() => setShowAbout(true)}
        onShowDataHelp={() => setShowDataHelp(true)}
      />
      <AboutModal
        show={showAbout}
        onClose={() => setShowAbout(false)}
        onOpenAiSettings={() => setShowAiSetup(true)}
      />
    </div>
  );
}
