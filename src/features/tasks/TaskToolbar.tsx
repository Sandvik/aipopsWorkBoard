import type { FormEvent } from "react";
import type { ProjectRecord } from "../../types";
import { getPriorityLabels } from "./taskUi";
import { useStrings } from "../../app/i18n";

type TaskToolbarProps = {
  hasWorkspace: boolean;
  projects: ProjectRecord[];
  selectedProjectSlug: string;
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
  isCreatingTask: boolean;
  busy: boolean;
  theme: "light" | "dark";
  onToggleTheme: () => void;
  notificationsEnabled: boolean;
  reminderMinutes: number;
  onOpenNotificationSettings: () => void;
  totalVisibleTasks: number;
  overdueVisibleTasks: number;
  dueTodayVisibleTasks: number;
  doingVisibleTasks: number;
  doneVisibleTasks: number;
  highPriorityVisibleTasks: number;
  newTaskTitle: string;
  newTaskAssignee: string;
  newTaskProjectSlug: string;
  onNewTaskTitleChange: (value: string) => void;
  onNewTaskAssigneeChange: (value: string) => void;
  onNewTaskProjectSlugChange: (value: string) => void;
  newTaskDescription: string;
  onNewTaskDescriptionChange: (value: string) => void;
  onAiSuggestNewTaskDescription: () => void;
  aiBusy: boolean;
  aiLabel: string;
  canSplitNewTaskDescription: boolean;
  onSplitNewTaskDescription: () => void;
  onOpenNewTask: () => void;
  onCancelNewTask: () => void;
  onSubmitNewTask: (event: FormEvent) => void;
};

export function TaskToolbar({
  hasWorkspace,
  projects,
  selectedProjectSlug,
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
  busy,
  theme,
  onToggleTheme,
  notificationsEnabled,
  reminderMinutes,
  onOpenNotificationSettings,
  totalVisibleTasks,
  overdueVisibleTasks,
  dueTodayVisibleTasks,
  doingVisibleTasks,
  doneVisibleTasks,
  highPriorityVisibleTasks,
  newTaskTitle,
  newTaskAssignee,
  newTaskProjectSlug,
  onNewTaskTitleChange,
  onNewTaskAssigneeChange,
  onNewTaskProjectSlugChange,
  newTaskDescription,
  onNewTaskDescriptionChange,
  onAiSuggestNewTaskDescription,
  aiBusy,
  aiLabel,
  canSplitNewTaskDescription,
  onSplitNewTaskDescription,
  onOpenNewTask,
  onCancelNewTask,
  onSubmitNewTask,
}: TaskToolbarProps) {
  const { toolbar: t } = useStrings();
  const priorityLabels = getPriorityLabels();
  const hasProblems = overdueVisibleTasks > 0 || highPriorityVisibleTasks > 0;
  const hasTodayWork = dueTodayVisibleTasks > 0 || doingVisibleTasks > 0;
  const summaryText = hasProblems
    ? t.statsSummaryProblems
    : hasTodayWork
      ? t.statsSummaryBusy
      : t.statsSummaryOk;

  return (
    <div className="toolbar">
      <div className="toolbar-row">
        <div className="toolbar-search">
          <div className="input-with-icon">
            <span className="input-with-icon-icon" aria-hidden="true">
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="7" cy="7" r="4.5" />
                <path d="M10.5 10.5 14 14" strokeLinecap="round" />
              </svg>
            </span>
            <input
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder={t.searchPlaceholder}
            />
          </div>
        </div>
        <div className="toolbar-stats">
          <span className="toolbar-stats-summary">{summaryText}</span>
          <span className="toolbar-stat-chip toolbar-stat-chip-primary toolbar-stat-chip-main">
            {totalVisibleTasks || t.statsTotalNone}{" "}
            {totalVisibleTasks === 1 ? t.statsTotalLabelSingular : t.statsTotalLabelPlural}
          </span>
          {dueTodayVisibleTasks > 0 ? (
            <span className="toolbar-stat-chip toolbar-stat-chip-today">
              {dueTodayVisibleTasks} {t.statsDueTodaySuffix}
            </span>
          ) : null}
          {overdueVisibleTasks > 0 ? (
            <span className="toolbar-stat-chip toolbar-stat-chip-danger toolbar-stat-chip-overdue">
              {overdueVisibleTasks}{" "}
              {overdueVisibleTasks === 1
                ? t.statsOverdueSuffixSingular
                : t.statsOverdueSuffixPlural}
            </span>
          ) : null}
          {doingVisibleTasks > 0 ? (
            <span className="toolbar-stat-chip toolbar-stat-chip-doing">
              {doingVisibleTasks} {t.statsDoingSuffix}
            </span>
          ) : null}
          {doneVisibleTasks > 0 ? (
            <span className="toolbar-stat-chip toolbar-stat-chip-today">
              {doneVisibleTasks}{" "}
              {doneVisibleTasks === 1
                ? t.statsDoneSuffixSingular
                : t.statsDoneSuffixPlural}
            </span>
          ) : null}
          {highPriorityVisibleTasks > 0 ? (
            <span className="toolbar-stat-chip toolbar-stat-chip-priority">
              {highPriorityVisibleTasks} {t.statsHighPrioritySuffix}
            </span>
          ) : null}
        </div>
        <div className="toolbar-actions">
          <button
            type="button"
            className="ghost-button theme-toggle-button"
            onClick={onToggleTheme}
            title={theme === "light" ? t.themeToggleLight : t.themeToggleDark}
          >
            <span className="toolbar-inline-icon" aria-hidden="true">
              {theme === "light" ? (
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M10.8 2.4A5.4 5.4 0 1 0 13.6 13 6 6 0 1 1 10.8 2.4Z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : (
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="8" cy="8" r="3" />
                  <path d="M8 1.5v2M8 12.5v2M1.5 8h2M12.5 8h2M3.4 3.4l1.4 1.4M11.2 11.2l1.4 1.4M12.6 3.4l-1.4 1.4M4.8 11.2l-1.4 1.4" strokeLinecap="round" />
                </svg>
              )}
            </span>
            <span className="visually-hidden">
              {theme === "light" ? t.themeToggleAriaDark : t.themeToggleAriaLight}
            </span>
          </button>
          <button
            type="button"
            className={`ghost-button filter-chip ${filtersActive ? "filter-chip-active" : ""}`}
            onClick={onToggleFilters}
            title={filtersActive ? t.filtersOn : t.filtersOff}
          >
            <span className="filter-chip-label">{t.filtersLabel}</span>
          </button>
          <button
            type="button"
            className="ghost-button"
            onClick={onOpenNotificationSettings}
            title={t.notificationSettingsTitle}
          >
            <span className="toolbar-inline-icon" aria-hidden="true">
              {notificationsEnabled ? (
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M8 2.5a3 3 0 0 1 3 3v1.1c0 .7.2 1.4.6 2l.8 1.2c.3.4 0 1-.5 1H4.1c-.5 0-.8-.6-.5-1l.8-1.2c.4-.6.6-1.3.6-2V5.5a3 3 0 0 1 3-3Z" strokeLinejoin="round" />
                  <path d="M6.5 12.5a1.5 1.5 0 0 0 3 0" strokeLinecap="round" />
                </svg>
              ) : (
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M5.2 5.2v1.4c0 .7-.2 1.4-.6 2l-.8 1.2c-.3.4 0 1 .5 1h5.1" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M10.8 10.8H12c.5 0 .8-.6.5-1l-.8-1.2c-.4-.6-.6-1.3-.6-2V5.5a3 3 0 0 0-5-2.2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="m2.5 2.5 11 11" strokeLinecap="round" />
                </svg>
              )}
            </span>
            {notificationsEnabled ? <span>{reminderMinutes}m</span> : null}
          </button>
          <button
            type="button"
            className="primary-button"
            disabled={busy || !projects.length}
            onClick={onOpenNewTask}
            title={projects.length ? t.newTaskWithProjects : t.newTaskNoProjects}
          >
            {projects.length ? `+ ${t.newTaskCreateLabel}` : t.noProjectsButtonLabel}
          </button>
        </div>
      </div>

      {showFilters ? (
        <div className="filter-panel">
          <select
            value={priorityFilter}
            onChange={(event) => onPriorityFilterChange(event.target.value)}
          >
            <option value="">{t.filtersAllPriorities}</option>
            {Object.entries(priorityLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <select
            value={assigneeFilter}
            onChange={(event) => onAssigneeFilterChange(event.target.value)}
          >
            <option value="">{t.filtersAllAssignees}</option>
            {assignees.map((assignee) => (
              <option key={assignee} value={assignee}>
                {assignee}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="ghost-button"
            onClick={onResetFilters}
            title={t.resetFilters}
          >
            {t.resetShort}
          </button>
        </div>
      ) : null}

      {filtersActive && <p className="muted small">{t.filtersHintActive}</p>}

      {isCreatingTask ? (
        <form className="new-task-panel" onSubmit={onSubmitNewTask}>
          <div className="new-task-grid">
            <label>
              <span className="field-label">
                {t.newTaskTitleLabel} <span className="required-mark">*</span>
              </span>
              <input
                value={newTaskTitle}
                onChange={(event) => onNewTaskTitleChange(event.target.value)}
                className={!newTaskTitle.trim() ? "input-invalid" : ""}
                placeholder={t.titlePlaceholder}
              />
            </label>
            <label>
              <span className="field-label">
                {t.newTaskProjectLabel} <span className="required-mark">*</span>
              </span>
              <select
                value={newTaskProjectSlug}
                onChange={(event) => onNewTaskProjectSlugChange(event.target.value)}
              >
                <option value="">
                  {hasWorkspace
                    ? t.newTaskProjectPlaceholderHasWorkspace
                    : t.newTaskProjectPlaceholderNoWorkspace}
                </option>
                {projects.map((project) => (
                  <option key={project.id} value={project.slug}>
                    {project.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              {t.newTaskAssigneeLabel}
              <input
                value={newTaskAssignee}
                onChange={(event) => onNewTaskAssigneeChange(event.target.value)}
                placeholder={t.newTaskAssigneePlaceholder}
              />
            </label>
          </div>
          <label className="new-task-description">
            <span className="field-label">{t.newTaskDescriptionLabel}</span>
            <textarea
              rows={2}
              value={newTaskDescription}
              onChange={(event) => onNewTaskDescriptionChange(event.target.value)}
              placeholder={t.descriptionPlaceholder}
            />
          </label>
          <div className="new-task-footer-row">
            <div className="ai-inline-actions">
              {canSplitNewTaskDescription ? (
                <button
                  type="button"
                  className="ghost-button"
                  onClick={onSplitNewTaskDescription}
                  disabled={busy || aiBusy}
                  title={t.aiSplitTooltip}
                >
                  {aiBusy ? t.aiSplitBusy : t.aiSplitIdle}
                </button>
              ) : (
                <button
                  type="button"
                  className="ghost-button"
                  onClick={onAiSuggestNewTaskDescription}
                  disabled={busy || aiBusy}
                  title={t.aiHelpTooltip}
                >
                  {aiBusy ? t.aiBusy : aiLabel}
                </button>
              )}
            </div>
            <div className="new-task-actions">
              <button
                type="button"
                className="ghost-button"
                onClick={onCancelNewTask}
                title={t.cancelNewTask}
              >
                {t.newTaskCancelLabel}
              </button>
              <button
                type="submit"
                className="primary-button"
                disabled={busy || !newTaskTitle.trim()}
                title={t.saveNewTask}
              >
                {t.newTaskCreateLabel}
              </button>
            </div>
          </div>
          <p className="form-note new-task-mail-hint">{t.newTaskMailHint}</p>
        </form>
      ) : null}
    </div>
  );
}
