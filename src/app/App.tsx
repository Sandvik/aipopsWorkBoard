// Page shell for AIPOPS Workboard.
// Denne komponent samler kun hooks og UI-komponenter – selve domænelogikken
// ligger i feature-hooks (tasks, projekter, workspace, async-feedback).
import { useEffect, useRef, useState } from "react";
import type { NoteRecord, ProjectRecord, TaskRecord, TaskStatus } from "../types";
import {
  loadConfig,
  loadNotes,
  pickWorkspaceDirectory,
  saveConfig,
  saveNotes,
  createTask,
  updateTask,
} from "../infrastructure/storage";
import { SplitTasksModal } from "../features/tasks/SplitTasksModal";
import { EMPTY_DRAFT, PanelDraft, isOverdue, parseDeadline } from "../features/tasks/taskUi";
import { useTaskFilters } from "../features/tasks/useTaskFilters";
import { useTaskActions } from "../features/tasks/useTaskActions";
import { NewProjectModal } from "../features/workspace/NewProjectModal";
import { useProjectActions } from "../features/workspace/useProjectActions";
import { useWorkspace } from "../features/workspace/useWorkspace";
import { loadAllDataModel } from "../features/workspace/loadAllDataModel";
import { persistWorkspaceHandle, restoreWorkspaceHandle } from "../features/workspace/workspacePersistence";
import { AppHeader } from "./layout/AppHeader";
import { TourOverlay } from "./layout/TourOverlay";
import { ConfirmModal } from "./layout/ConfirmModal";
import { AppFooter } from "./layout/AppFooter";
import { AboutModal } from "./layout/AboutModal";
import { useAsyncFeedback } from "./layout/useAsyncFeedback";
import { AiSettingsModal } from "./layout/AiSettingsModal";
import { MorningBriefModal } from "./layout/MorningBriefModal";
import { NotificationSettingsModal } from "./layout/NotificationSettingsModal";
import { useAiFeatures } from "./layout/useAiFeatures";
import { WorkspaceShell } from "./layout/WorkspaceShell";
import { buildWorkspaceViewModel } from "../features/workspace/workspaceViewModel";
import { LocaleProvider, useStrings } from "./i18n";
import { NotesModal } from "../features/notes/NotesModal";

type WorkspaceHandle = FileSystemDirectoryHandle | null;

function AppInner() {
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
  const [dragOverStatus, setDragOverStatus] = useState<TaskStatus | "">("");
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
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [deadlineReminderMinutes, setDeadlineReminderMinutes] = useState(30);
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);
  const [notes, setNotes] = useState<NoteRecord[]>([]);
  const [showNotes, setShowNotes] = useState(false);
  const [notesSaving, setNotesSaving] = useState(false);
  const notesLoadedRef = useRef(false);
  const notesSaveTimerRef = useRef<number | null>(null);
  const deadlineNotificationsRef = useRef<Set<string>>(new Set());
  const taskOpenLockUntilRef = useRef(0);
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
        setNotificationsEnabled(true);
        setDeadlineReminderMinutes(30);
        setNotes([]);
        notesLoadedRef.current = false;
        return;
      }
      const config = await loadConfig(workspace);
      const nextKey = config?.ai?.apiKey ?? null;
      setAiApiKey(nextKey);
      setNotificationsEnabled(config?.notifications?.enabled ?? true);
      setDeadlineReminderMinutes(config?.notifications?.reminderMinutes ?? 30);
      // Hvis der ikke er nogen nøgle og brugeren ikke tidligere er blevet præsenteret
      // for AI-opsætning for denne arbejdsmappe, viser vi en lille wizard.
      if (!nextKey && !config?.ai?.seenSetup) {
        setShowAiSetup(true);
      }

      const loadedNotes = await loadNotes(workspace);
      setNotes(loadedNotes?.notes ?? []);
      notesLoadedRef.current = true;
    })();
  }, [workspace]);

  // Autosave noter som en fil i workspace-roden (debounced).
  useEffect(() => {
    if (!workspace) return;
    if (!notesLoadedRef.current) return;
    if (notesSaveTimerRef.current) {
      window.clearTimeout(notesSaveTimerRef.current);
    }
    notesSaveTimerRef.current = window.setTimeout(() => {
      void (async () => {
        try {
          setNotesSaving(true);
          await saveNotes(workspace, notes);
        } catch (caught) {
          console.error("Kunne ikke gemme noter", caught);
          setError("Kunne ikke gemme noter. Tjek at arbejdsmappe-adgang stadig er tilladt.");
        } finally {
          setNotesSaving(false);
        }
      })();
    }, 800);
    return () => {
      if (notesSaveTimerRef.current) {
        window.clearTimeout(notesSaveTimerRef.current);
      }
    };
  }, [notes, workspace, setError]);

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

  function lockTaskOpen(ms = 450) {
    taskOpenLockUntilRef.current = Date.now() + ms;
  }

  function handleBoardTaskSelect(taskId: string) {
    if (Date.now() < taskOpenLockUntilRef.current) {
      return;
    }
    setSelectedTaskId(taskId);
  }

  function handleBoardTaskDragStart(taskId: string) {
    lockTaskOpen(900);
    setSelectedTaskId("");
    setDragTaskId(taskId);
    setDragOverStatus("");
  }

  function handleBoardTaskDragEnterColumn(status: TaskStatus) {
    if (!dragTaskId) return;
    setDragOverStatus((current) => (current === status ? current : status));
  }

  function handleBoardTaskDragEnd() {
    lockTaskOpen(600);
    setDragTaskId("");
    setDragOverStatus("");
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
  const overdueVisibleTasks = visibleTasks.filter(
    (task) => task.status !== "done" && isOverdue(task.deadline),
  ).length;
  const todayLabel = new Date().toDateString();
  const dueTodayVisibleTasks = visibleTasks.filter(
    (task) => {
      const parsed = parseDeadline(task.deadline);
      return Boolean(parsed && parsed.toDateString() === todayLabel);
    },
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

  useEffect(() => {
    if (typeof window === "undefined" || typeof Notification === "undefined") return;
    if (!workspace) return;
    if (!notificationsEnabled) return;
    if (Notification.permission !== "default") return;

    void Notification.requestPermission();
  }, [workspace, notificationsEnabled]);

  useEffect(() => {
    deadlineNotificationsRef.current.clear();
  }, [notificationsEnabled, deadlineReminderMinutes]);

  useEffect(() => {
    if (typeof window === "undefined" || typeof Notification === "undefined") return;
    if (!notificationsEnabled) return;
    if (Notification.permission !== "granted") return;

    const seen = deadlineNotificationsRef.current;
    const now = Date.now();
    const allTasks = Object.values(tasksByProject).flat();
    const activeTasks = allTasks.filter((task) => task.status !== "done" && task.deadline);
    for (const task of activeTasks) {
      const parsed = parseDeadline(task.deadline);
      if (!parsed) continue;
      const dueMs = parsed.getTime();
      const minsLeft = Math.floor((dueMs - now) / 60000);
      const notifySoonKey = `${task.id}:soon`;
      const notifyOverdueKey = `${task.id}:overdue`;

      if (minsLeft >= 0 && minsLeft <= deadlineReminderMinutes && !seen.has(notifySoonKey)) {
        const title = minsLeft <= 0 ? "Deadline nu" : `Deadline om ${minsLeft} min`;
        new Notification(title, {
          body: task.title,
          tag: notifySoonKey,
        });
        seen.add(notifySoonKey);
      }

      if (dueMs < now && !seen.has(notifyOverdueKey)) {
        new Notification("Deadline overskredet", {
          body: task.title,
          tag: notifyOverdueKey,
        });
        seen.add(notifyOverdueKey);
      }
    }

    const intervalId = window.setInterval(() => {
      if (Notification.permission !== "granted") return;
      const currentNow = Date.now();
      const currentTasks = Object.values(tasksByProject)
        .flat()
        .filter((task) => task.status !== "done" && task.deadline);
      for (const task of currentTasks) {
        const parsed = parseDeadline(task.deadline);
        if (!parsed) continue;
        const dueMs = parsed.getTime();
        const minsLeft = Math.floor((dueMs - currentNow) / 60000);
        const notifySoonKey = `${task.id}:soon`;
        const notifyOverdueKey = `${task.id}:overdue`;

        if (minsLeft >= 0 && minsLeft <= deadlineReminderMinutes && !seen.has(notifySoonKey)) {
          const title = minsLeft <= 0 ? "Deadline nu" : `Deadline om ${minsLeft} min`;
          new Notification(title, {
            body: task.title,
            tag: notifySoonKey,
          });
          seen.add(notifySoonKey);
        }

        if (dueMs < currentNow && !seen.has(notifyOverdueKey)) {
          new Notification("Deadline overskredet", {
            body: task.title,
            tag: notifyOverdueKey,
          });
          seen.add(notifyOverdueKey);
        }
      }
    }, 60_000);

    return () => window.clearInterval(intervalId);
  }, [tasksByProject, notificationsEnabled, deadlineReminderMinutes]);

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

  const { dataHelp } = useStrings();

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
        dragOverStatus={dragOverStatus}
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
        notificationsEnabled={notificationsEnabled}
        reminderMinutes={deadlineReminderMinutes}
        onOpenNotificationSettings={() => setShowNotificationSettings(true)}
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
        onTaskSelect={handleBoardTaskSelect}
        onTaskDrop={(taskId, status, orderedTaskIds) => {
          lockTaskOpen(600);
          void handleTaskDrop(taskId, status, orderedTaskIds);
        }}
        onTaskDragStart={handleBoardTaskDragStart}
        onTaskDragEnterColumn={handleBoardTaskDragEnterColumn}
        onTaskDragEnd={handleBoardTaskDragEnd}
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
        onShowNotes={() => setShowNotes(true)}
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
            title={dataHelp.title}
            className="confirm-modal-large"
            showCancel={false}
            message={
              <>
                <p>{dataHelp.intro}</p>
                <ul>
                  <li>
                    <strong>{dataHelp.bulletSamePc.split(":")[0]}:</strong>{" "}
                    {dataHelp.bulletSamePc.split(":").slice(1).join(":").trim()}
                  </li>
                  <li>
                    <strong>{dataHelp.bulletNewComputer.split(":")[0]}:</strong>{" "}
                    {dataHelp.bulletNewComputer.split(":").slice(1).join(":").trim()}
                  </li>
                  <li>
                    <strong>{dataHelp.bulletMultiple.split(":")[0]}:</strong>{" "}
                    {dataHelp.bulletMultiple.split(":").slice(1).join(":").trim()}
                  </li>
                </ul>
                <p>{dataHelp.outro}</p>
              </>
            }
            confirmLabel={dataHelp.confirmLabel}
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

        <NotesModal
        open={showNotes}
        busy={busy}
        saving={notesSaving}
        notes={notes}
        onClose={() => setShowNotes(false)}
        onChangeNotes={(next) => setNotes(next)}
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

        <NotificationSettingsModal
        open={showNotificationSettings}
        busy={busy}
        initialEnabled={notificationsEnabled}
        initialReminderMinutes={deadlineReminderMinutes}
        onClose={() => setShowNotificationSettings(false)}
        onSave={async ({ enabled, reminderMinutes }) => {
          setShowNotificationSettings(false);
          if (!workspace) return;
          const existing = (await loadConfig(workspace)) ?? {};
          await saveConfig(workspace, {
            ...existing,
            notifications: {
              enabled,
              reminderMinutes,
            },
          });
          setNotificationsEnabled(enabled);
          setDeadlineReminderMinutes(reminderMinutes);
          if (enabled && typeof Notification !== "undefined" && Notification.permission === "default") {
            await Notification.requestPermission();
          }
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

export default function App() {
  return (
    <LocaleProvider>
      <AppInner />
    </LocaleProvider>
  );
}
