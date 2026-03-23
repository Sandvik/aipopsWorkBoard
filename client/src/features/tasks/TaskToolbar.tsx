// Toolbar'en over boardet:
// - søgefelt
// - filter-knap + filterpanel
// - "Ny opgave"-knap og inline formular til hurtig oprettelse.
import type { FormEvent } from "react";
import type { ProjectRecord } from "../../types";
import { PRIORITY_LABELS } from "./taskUi";
import { useStrings } from "../../i18n";

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
            <span className="input-with-icon-icon">🔍</span>
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
            <span aria-hidden="true">{theme === "light" ? "🌙" : "☀️"}</span>
            <span className="visually-hidden">
              {theme === "light" ? "Skift til mørk tilstand" : "Skift til lys tilstand"}
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
            title="Aabn notifikationsindstillinger"
          >
            {notificationsEnabled ? `🔔 ${reminderMinutes}m` : "🔕"}
          </button>
          <button
            type="button"
            className="primary-button"
            disabled={busy || !projects.length}
            onClick={onOpenNewTask}
            title={projects.length ? t.newTaskWithProjects : t.newTaskNoProjects}
          >
            {projects.length ? `+ ${t.newTaskCreateLabel}` : `+ ${t.newProjectButton ?? "Projekt"}`}
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
            {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
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
            {/** Label holdes kort; kan evt. også gøres til i18n senere */}
            Nulstil
          </button>
        </div>
      ) : null}

      {filtersActive && (
        <p className="muted small">{t.filtersHintActive}</p>
      )}

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
                  {aiBusy ? "Laver opgave-forslag…" : "Lav konkrete opgaver ud fra teksten"}
                </button>
              ) : (
                <button
                  type="button"
                  className="ghost-button"
                  onClick={onAiSuggestNewTaskDescription}
                  disabled={busy || aiBusy}
                  title={t.aiHelpTooltip}
                >
                  {aiBusy ? "Arbejder med tekst…" : aiLabel}
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
          <p className="form-note new-task-mail-hint">
            {t.newTaskMailHint}
          </p>
        </form>
      ) : null}
    </div>
  );
}

