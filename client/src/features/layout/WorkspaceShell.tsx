import type { ProjectRecord, TaskRecord, TaskStatus } from "../../types";
import { TaskBoard } from "../tasks/TaskBoard";
import { TaskDetailsPanel } from "../tasks/TaskDetailsPanel";
import { TaskToolbar } from "../tasks/TaskToolbar";
import { WorkspaceSidebar } from "../workspace/WorkspaceSidebar";
import { WorkspaceEmptyState } from "../workspace/WorkspaceEmptyState";
import type { PanelDraft } from "../tasks/taskUi";
import { ErrorBoundary } from "./ErrorBoundary";
import { useStrings } from "../../i18n";

type WorkspaceShellProps = {
  isMobileLike: boolean;
  // Workspace / projekter
  hasWorkspace: boolean;
  workspaceName: string;
  busy: boolean;
  projects: ProjectRecord[];
  activeProjects: ProjectRecord[];
  archivedProjects: ProjectRecord[];
  tasksByProject: Record<string, TaskRecord[]>;
  selectedProjectSlug: string;
  selectedTaskId: string;
  dragTaskId: string;
  selectedTask: TaskRecord | null;
  // Statetiketter
  workspaceProgressLabel: string;
  workspaceProgressTooltip: string;
  projectTooltips: Record<string, string>;
  projectTaskCounts: Record<string, number>;
  // Onboarding / tur
  startTourAfterWorkspace: boolean;
  onStartTourToggle: (checked: boolean) => void;
  // Filtre / søgning
  search: string;
  onSearchChange: (value: string) => void;
  showFilters: boolean;
  onToggleFilters: () => void;
  filtersActive: boolean;
  priorityFilter: string;
  assigneeFilter: string;
  onPriorityFilterChange: (value: string) => void;
  onAssigneeFilterChange: (value: string) => void;
  assignees: string[];
  onResetFilters: () => void;
  // Ny opgave
  isCreatingTask: boolean;
  theme: "light" | "dark";
  onToggleTheme: () => void;
  totalVisibleTasks: number;
  overdueVisibleTasks: number;
  dueTodayVisibleTasks: number;
  doingVisibleTasks: number;
  doneVisibleTasks: number;
  highPriorityVisibleTasks: number;
  newTaskTitle: string;
  newTaskAssignee: string;
  newTaskProjectSlug: string;
  newTaskDescription: string;
  onNewTaskTitleChange: (value: string) => void;
  onNewTaskAssigneeChange: (value: string) => void;
  onNewTaskProjectSlugChange: (value: string) => void;
  onNewTaskDescriptionChange: (value: string) => void;
  aiBusy: boolean;
  aiLabel: string;
  canSplitNewTaskDescription: boolean;
  onSplitNewTaskDescription: () => void;
  onAiSuggestNewTaskDescription: () => void;
  onOpenNewTask: () => void;
  onCancelNewTask: () => void;
  onSubmitNewTask: (event: React.FormEvent) => void;
  // Board / tasks
  visibleTasks: TaskRecord[];
  onTaskSelect: (taskId: string) => void;
  onTaskDrop: (taskId: string, status: TaskStatus) => void;
  onTaskDragStart: (taskId: string) => void;
  onTaskDragEnd: () => void;
  // Detaljepanel
  panelDraft: PanelDraft;
  commentText: string;
  taskJustSaved: boolean;
  canSplitFromDescription: boolean;
  onAiSummarizeDescription: () => void;
  onOpenAiSettings: () => void;
  onSplitFromDescription: () => void;
  onCloseDetails: () => void;
  onDraftChange: (draft: PanelDraft) => void;
  onCommentTextChange: (value: string) => void;
  onSaveTask: () => void;
  onDeleteTask: () => void;
  onAttachmentChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onAttachmentOpen: (id: string) => void;
  onAttachmentDelete: (id: string) => void;
  // Sidebar callbacks
  onShowMorningBrief: () => void;
  onShowNotes: () => void;
  onPickWorkspace: () => void;
  onRefreshData: () => void;
  onCreateProject: () => void;
  onSelectProject: (slug: string) => void;
  onDeleteProject: (project: ProjectRecord) => void;
};

export function WorkspaceShell({
  isMobileLike,
  hasWorkspace,
  workspaceName,
  busy,
  projects,
  activeProjects,
  archivedProjects,
  tasksByProject,
  selectedProjectSlug,
  selectedTaskId,
  dragTaskId,
  selectedTask,
  workspaceProgressLabel,
  workspaceProgressTooltip,
  projectTooltips,
  projectTaskCounts,
  startTourAfterWorkspace,
  onStartTourToggle,
  search,
  onSearchChange,
  showFilters,
  onToggleFilters,
  filtersActive,
  priorityFilter,
  assigneeFilter,
  onPriorityFilterChange,
  onAssigneeFilterChange,
  assignees,
  onResetFilters,
  isCreatingTask,
  theme,
  onToggleTheme,
  totalVisibleTasks,
  overdueVisibleTasks,
  dueTodayVisibleTasks,
  doingVisibleTasks,
  doneVisibleTasks,
  highPriorityVisibleTasks,
  newTaskTitle,
  newTaskAssignee,
  newTaskProjectSlug,
  newTaskDescription,
  onNewTaskTitleChange,
  onNewTaskAssigneeChange,
  onNewTaskProjectSlugChange,
  onNewTaskDescriptionChange,
  aiBusy,
  aiLabel,
  canSplitNewTaskDescription,
  onSplitNewTaskDescription,
  onAiSuggestNewTaskDescription,
  onOpenNewTask,
  onCancelNewTask,
  onSubmitNewTask,
  visibleTasks,
  onTaskSelect,
  onTaskDrop,
  onTaskDragStart,
  onTaskDragEnd,
  panelDraft,
  commentText,
  taskJustSaved,
  canSplitFromDescription,
  onAiSummarizeDescription,
  onOpenAiSettings,
  onSplitFromDescription,
  onCloseDetails,
  onDraftChange,
  onCommentTextChange,
  onSaveTask,
  onDeleteTask,
  onAttachmentChange,
  onAttachmentOpen,
  onAttachmentDelete,
  onShowMorningBrief,
  onShowNotes,
  onPickWorkspace,
  onRefreshData,
  onCreateProject,
  onSelectProject,
  onDeleteProject,
}: WorkspaceShellProps) {
  const { onboarding: onboardingStrings } = useStrings();
  return (
    <>
      {isMobileLike ? (
        <div className="mobile-warning-backdrop">
          <div className="mobile-warning-card">
            <h1 className="mobile-warning-title">{onboardingStrings.mobileWarningTitle}</h1>
            <p className="mobile-warning-text">{onboardingStrings.mobileWarningBody}</p>
          </div>
        </div>
      ) : null}

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
          onShowMorningBrief={onShowMorningBrief}
          onShowNotes={onShowNotes}
          onPickWorkspace={onPickWorkspace}
          onRefreshData={onRefreshData}
          onCreateProject={onCreateProject}
          onSelectProject={onSelectProject}
          onDeleteProject={onDeleteProject}
        />

        <ErrorBoundary>
          <main className="main-area">
            {hasWorkspace ? (
              <>
                <TaskToolbar
                  hasWorkspace={hasWorkspace}
                  projects={projects}
                  selectedProjectSlug={selectedProjectSlug}
                  search={search}
                  onSearchChange={onSearchChange}
                  showFilters={showFilters}
                  onToggleFilters={onToggleFilters}
                  filtersActive={filtersActive}
                  priorityFilter={priorityFilter}
                  assigneeFilter={assigneeFilter}
                  onPriorityFilterChange={onPriorityFilterChange}
                  onAssigneeFilterChange={onAssigneeFilterChange}
                  assignees={assignees}
                  onResetFilters={onResetFilters}
                  isCreatingTask={isCreatingTask}
                  busy={busy}
                  theme={theme}
                  onToggleTheme={onToggleTheme}
                  totalVisibleTasks={totalVisibleTasks}
                  overdueVisibleTasks={overdueVisibleTasks}
                  dueTodayVisibleTasks={dueTodayVisibleTasks}
                  doingVisibleTasks={doingVisibleTasks}
                  doneVisibleTasks={doneVisibleTasks}
                  highPriorityVisibleTasks={highPriorityVisibleTasks}
                  newTaskTitle={newTaskTitle}
                  newTaskAssignee={newTaskAssignee}
                  newTaskProjectSlug={newTaskProjectSlug}
                  onNewTaskTitleChange={onNewTaskTitleChange}
                  onNewTaskAssigneeChange={onNewTaskAssigneeChange}
                  onNewTaskProjectSlugChange={onNewTaskProjectSlugChange}
                  newTaskDescription={newTaskDescription}
                  onNewTaskDescriptionChange={onNewTaskDescriptionChange}
                  aiBusy={aiBusy}
                  aiLabel={aiLabel}
                  canSplitNewTaskDescription={canSplitNewTaskDescription}
                  onSplitNewTaskDescription={onSplitNewTaskDescription}
                  onAiSuggestNewTaskDescription={onAiSuggestNewTaskDescription}
                  onOpenNewTask={onOpenNewTask}
                  onCancelNewTask={onCancelNewTask}
                  onSubmitNewTask={onSubmitNewTask}
                />

                <section
                  className="board"
                  onClick={() => {
                    onTaskSelect("");
                  }}
                >
                  {visibleTasks.length === 0 ? (
                    <div className="board-empty">
                      <p>{onboardingStrings.emptyBoardTitle}</p>
                      <p className="muted small">{onboardingStrings.emptyBoardBody}</p>
                    </div>
                  ) : null}
                  <TaskBoard
                    tasks={visibleTasks}
                    projects={projects}
                    selectedTaskId={selectedTaskId}
                    dragTaskId={dragTaskId}
                    onTaskSelect={onTaskSelect}
                    onTaskDrop={onTaskDrop}
                    onTaskDragStart={onTaskDragStart}
                    onTaskDragEnd={onTaskDragEnd}
                  />
                </section>
              </>
            ) : (
              <WorkspaceEmptyState
                startTourAfterWorkspace={startTourAfterWorkspace}
                busy={busy}
                onStartTourToggle={onStartTourToggle}
                onPickWorkspace={onPickWorkspace}
              />
            )}
          </main>
        </ErrorBoundary>

        {selectedTask ? (
          <TaskDetailsPanel
            task={selectedTask}
            projects={projects}
            draft={panelDraft}
            commentText={commentText}
            busy={busy}
            taskJustSaved={taskJustSaved}
            onAiSummarizeDescription={onAiSummarizeDescription}
            onOpenAiSettings={onOpenAiSettings}
            aiLabel={aiLabel}
            aiBusy={aiBusy}
            canSplitFromDescription={canSplitFromDescription}
            onSplitFromDescription={onSplitFromDescription}
            onClose={onCloseDetails}
            onDraftChange={onDraftChange}
            onCommentTextChange={onCommentTextChange}
            onSave={onSaveTask}
            onDelete={onDeleteTask}
            onAttachmentChange={onAttachmentChange}
            onAttachmentOpen={onAttachmentOpen}
            onAttachmentDelete={onAttachmentDelete}
          />
        ) : null}
      </div>
    </>
  );
}

