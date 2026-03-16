// Page shell for AIPOPS Workboard.
// Denne komponent samler kun hooks og UI-komponenter – selve domænelogikken
// ligger i feature-hooks (tasks, projekter, workspace, async-feedback).
import { useEffect, useRef, useState } from "react";
import type { ProjectRecord, TaskRecord, TaskStatus } from "./types";
import { loadConfig, pickWorkspaceDirectory, saveConfig } from "./infrastructure/storage";
import {
  generateMorningBrief,
  optimizeTaskTitle,
  summarizeDescription,
  summarizeDescriptionFromMessage,
  suggestTaskDescription,
} from "./infrastructure/aiClient";
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
import { AiSettingsModal } from "./features/layout/AiSettingsModal";
import { MorningBriefModal } from "./features/layout/MorningBriefModal";

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
  const [showAbout, setShowAbout] = useState(false);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [isMobileLike, setIsMobileLike] = useState(false);
  const [aiApiKey, setAiApiKey] = useState<string | null>(null);
  const [showAiSetup, setShowAiSetup] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const [morningBrief, setMorningBrief] = useState("");
  const [showMorningBrief, setShowMorningBrief] = useState(false);
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

  const activeProjectSlugs = projects.filter((project) => !project.archived).map((project) => project.slug);
  const allActiveTasks = activeProjectSlugs.flatMap((slug) => tasksByProject[slug] ?? []);
  const totalActiveTasks = allActiveTasks.length;
  const totalDoneTasks = allActiveTasks.filter((task) => task.status === "done").length;
  const totalBacklogTasks = allActiveTasks.filter((task) => task.status === "backlog").length;
  const totalTodoTasks = allActiveTasks.filter((task) => task.status === "todo").length;
  const totalDoingTasks = allActiveTasks.filter((task) => task.status === "doing").length;
  const workspaceProgressLabel =
    totalActiveTasks === 0
      ? "Ingen opgaver endnu"
      : `${totalActiveTasks} opgave${totalActiveTasks === 1 ? "" : "r"} \u00b7 ${
          totalDoneTasks || "Ingen"
        } færdig${totalDoneTasks === 1 ? "" : "e"} (${Math.round(
          (totalDoneTasks / Math.max(totalActiveTasks, 1)) * 100,
        )}%)`;
  const workspaceProgressTooltip =
    totalActiveTasks === 0
      ? "Der er endnu ingen opgaver i dine aktive projekter."
      : `Aktive projekter: ${activeProjectSlugs.length} \u00b7 Opgaver i alt: ${totalActiveTasks} \u00b7 Backlog: ${totalBacklogTasks} \u00b7 Klar: ${totalTodoTasks} \u00b7 I gang: ${totalDoingTasks} \u00b7 Færdige: ${totalDoneTasks}`;

  const projectTooltips: Record<string, string> = {};
  const projectTaskCounts: Record<string, number> = {};
  projects.forEach((project) => {
    const tasks = tasksByProject[project.slug] ?? [];
    projectTaskCounts[project.slug] = tasks.length;
    if (!tasks.length) {
      projectTooltips[project.slug] = "Ingen opgaver endnu i dette projekt.";
      return;
    }
    const backlog = tasks.filter((task) => task.status === "backlog").length;
    const todo = tasks.filter((task) => task.status === "todo").length;
    const doing = tasks.filter((task) => task.status === "doing").length;
    const done = tasks.filter((task) => task.status === "done").length;
    const overdue = tasks.filter((task) => isOverdue(task.deadline)).length;
    const highPriority = tasks.filter(
      (task) => task.priority === "High" || task.priority === "Critical",
    ).length;
    projectTooltips[project.slug] =
      `Opgaver i alt: ${tasks.length} \u00b7 Backlog: ${backlog} \u00b7 Klar: ${todo} \u00b7 ` +
      `I gang: ${doing} \u00b7 Færdige: ${done}` +
      (overdue ? ` \u00b7 Forsinkede: ${overdue}` : "") +
      (highPriority ? ` \u00b7 Høj prioritet: ${highPriority}` : "");
  });

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
          workspaceProgressLabel={workspaceProgressLabel}
          workspaceProgressTooltip={workspaceProgressTooltip}
          projectTooltips={projectTooltips}
          projectTaskCounts={projectTaskCounts}
          onShowMorningBrief={() => {
            if (!aiApiKey) {
              setShowAiSetup(true);
              return;
            }
            setMorningBrief("Genererer brief…");
            setShowMorningBrief(true);
            const lines: string[] = [];
            const today = new Date();
            const todayLabel = today.toLocaleDateString("da-DK", {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
            });
            lines.push(`Dato: ${todayLabel}`);
            lines.push("");
            activeProjects.forEach((project) => {
              const tasks = tasksByProject[project.slug] ?? [];
              if (!tasks.length) return;
              const backlog = tasks.filter((task) => task.status === "backlog").length;
              const todo = tasks.filter((task) => task.status === "todo").length;
              const doing = tasks.filter((task) => task.status === "doing").length;
              const done = tasks.filter((task) => task.status === "done").length;
              const overdue = tasks.filter((task) => isOverdue(task.deadline)).length;
              const highPriority = tasks.filter(
                (task) => task.priority === "High" || task.priority === "Critical",
              ).length;
              lines.push(
                `Projekt: ${project.name} – Opgaver i alt: ${tasks.length}, Backlog: ${backlog}, Klar: ${todo}, I gang: ${doing}, Færdige: ${done}, Forsinkede: ${overdue}, Høj prioritet: ${highPriority}`,
              );
              const importantTasks = tasks
                .filter((task) => isOverdue(task.deadline) || task.priority === "High" || task.priority === "Critical" || task.status === "doing")
                .slice(0, 3);
              importantTasks.forEach((task) => {
                const statusLabel = task.status === "backlog"
                  ? "Backlog"
                  : task.status === "todo"
                    ? "Klar"
                    : task.status === "doing"
                      ? "I gang"
                      : "Færdig";
                const deadlineText = task.deadline
                  ? `, frist: ${new Date(task.deadline).toLocaleDateString("da-DK")}`
                  : "";
                lines.push(`- [${statusLabel}] ${task.title}${deadlineText}`);
              });
              lines.push("");
            });
            const context = lines.join("\n");

            void (async () => {
              setAiBusy(true);
              try {
                await runAction(async () => {
                  const brief = await generateMorningBrief({
                    apiKey: aiApiKey,
                    context,
                  });
                  setMorningBrief(brief);
                });
              } finally {
                setAiBusy(false);
              }
            })();
          }}
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
                newTaskDescription={newTaskDescription}
                onNewTaskDescriptionChange={(value) => setNewTaskDescription(value)}
                aiBusy={aiBusy}
                aiLabel={
                  aiApiKey && newTaskDescription.length > 120
                    ? "✨ Ryd op fra mail/Teams"
                    : "✨ Hjælp til beskrivelse"
                }
                onAiSuggestNewTaskDescription={() => {
                  if (!aiApiKey) {
                    setShowAiSetup(true);
                    return;
                  }
                  if (!newTaskTitle && !newTaskDescription) {
                    setMessage("Skriv mindst en titel eller lidt tekst først.");
                    return;
                  }
                  void (async () => {
                    setAiBusy(true);
                    try {
                      await runAction(async () => {
                        const looksLikeMessage =
                          newTaskDescription.length > 120 &&
                          (/@(.*)\./.test(newTaskDescription) ||
                            /mvh|med venlig hilsen|venlig hilsen|best regards|from:|fra:|sent:|sendt:/i.test(
                              newTaskDescription,
                            ));
                        if (looksLikeMessage) {
                          const result = await summarizeDescriptionFromMessage({
                            apiKey: aiApiKey,
                            text: newTaskDescription,
                          });
                          setNewTaskDescription(result.shorter);
                        } else {
                          const suggestion = await suggestTaskDescription({
                            apiKey: aiApiKey,
                            title: newTaskTitle,
                            currentDescription: newTaskDescription,
                          });
                          setNewTaskDescription(suggestion);
                        }
                      });
                    } finally {
                      setAiBusy(false);
                    }
                  })();
                }}
                onOpenNewTask={() => {
                  setIsCreatingTask(true);
                  setNewTaskProjectSlug(selectedProjectSlug || projects[0]?.slug || "");
                }}
                onCancelNewTask={() => {
                  setIsCreatingTask(false);
                  setNewTaskTitle("");
                  setNewTaskAssignee("");
                  setNewTaskProjectSlug("");
                  setNewTaskDescription("");
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
            onAiSummarizeDescription={() => {
              if (!aiApiKey) {
                setShowAiSetup(true);
                return;
              }
              void (async () => {
                setAiBusy(true);
                try {
                  await runAction(async () => {
                    const text = panelDraft.description.trim() || panelDraft.title.trim();
                    if (!text) {
                      setMessage("Skriv mindst en titel eller lidt tekst først.");
                      return;
                    }
                    const looksLikeMessage =
                      panelDraft.description.length > 120 &&
                      (/@(.*)\./.test(panelDraft.description) ||
                        /mvh|med venlig hilsen|venlig hilsen|best regards|from:|fra:|sent:|sendt:/i.test(
                          panelDraft.description,
                        ));
                    const result = looksLikeMessage
                      ? await summarizeDescriptionFromMessage({
                          apiKey: aiApiKey,
                          text,
                        })
                      : await summarizeDescription({
                          apiKey: aiApiKey,
                          text,
                        });
                    // Opdater beskrivelsen først
                    let nextDraft: PanelDraft = {
                      ...panelDraft,
                      description: result.shorter,
                    };
                    // Forsøg også at optimere titlen ud fra den nye beskrivelse
                    try {
                      const optimizedTitle = await optimizeTaskTitle({
                        apiKey: aiApiKey,
                        title: nextDraft.title || selectedTask?.title || "",
                        description: nextDraft.description,
                        deadlineLabel: nextDraft.deadline || undefined,
                      });
                      if (optimizedTitle && optimizedTitle.trim()) {
                        nextDraft = {
                          ...nextDraft,
                          title: optimizedTitle.trim(),
                        };
                      }
                    } catch (optError) {
                      // eslint-disable-next-line no-console
                      console.warn("Kunne ikke optimere titel", optError);
                    }
                    setPanelDraft(nextDraft);
                  });
                } finally {
                  setAiBusy(false);
                }
              })();
            }}
            onOpenAiSettings={() => setShowAiSetup(true)}
            aiLabel={
              aiApiKey && panelDraft.description.length > 120
                ? "✨ Ryd op fra mail/Teams"
                : "✨ Hjælp til beskrivelse"
            }
            aiBusy={aiBusy}
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

      <MorningBriefModal
        open={showMorningBrief}
        brief={morningBrief}
        onClose={() => setShowMorningBrief(false)}
      />

      <AiSettingsModal
        open={showAiSetup}
        busy={busy}
        initialApiKey={aiApiKey}
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

      <AppFooter onShowAbout={() => setShowAbout(true)} />
      <AboutModal
        show={showAbout}
        onClose={() => setShowAbout(false)}
        onOpenAiSettings={() => setShowAiSetup(true)}
      />
    </div>
  );
}
