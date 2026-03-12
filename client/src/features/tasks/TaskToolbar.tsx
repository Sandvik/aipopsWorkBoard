// Toolbar'en over boardet:
// - søgefelt
// - filter-knap + filterpanel
// - "Ny opgave"-knap og inline formular til hurtig oprettelse.
import type { FormEvent } from "react";
import type { ProjectRecord } from "../../types";
import { PRIORITY_LABELS } from "./taskUi";

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
  onOpenNewTask,
  onCancelNewTask,
  onSubmitNewTask,
}: TaskToolbarProps) {
  const hasProblems = overdueVisibleTasks > 0 || highPriorityVisibleTasks > 0;
  const hasTodayWork = dueTodayVisibleTasks > 0 || doingVisibleTasks > 0;
  const summaryText = hasProblems
    ? "Lidt at indhente i dag"
    : hasTodayWork
      ? "God arbejdsdag i gang"
      : "Du har fint styr på tingene";

  return (
    <div className="toolbar">
      <div className="toolbar-row">
        <div className="toolbar-search">
          <div className="input-with-icon">
            <span className="input-with-icon-icon">🔍</span>
            <input
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Søg i opgaver"
            />
          </div>
        </div>
        <div className="toolbar-stats">
          <span className="toolbar-stats-summary">{summaryText}</span>
          <span className="toolbar-stat-chip toolbar-stat-chip-primary toolbar-stat-chip-main">
            {totalVisibleTasks || "Ingen"} opgave
            {totalVisibleTasks === 1 ? "" : "r"}
          </span>
          {dueTodayVisibleTasks > 0 ? (
            <span className="toolbar-stat-chip toolbar-stat-chip-today">
              {dueTodayVisibleTasks} i dag
            </span>
          ) : null}
          {overdueVisibleTasks > 0 ? (
            <span className="toolbar-stat-chip toolbar-stat-chip-danger toolbar-stat-chip-overdue">
              {overdueVisibleTasks} forsinket
              {overdueVisibleTasks === 1 ? "" : "e"}
            </span>
          ) : null}
          {doingVisibleTasks > 0 ? (
            <span className="toolbar-stat-chip toolbar-stat-chip-doing">
              {doingVisibleTasks} i gang
            </span>
          ) : null}
          {doneVisibleTasks > 0 ? (
            <span className="toolbar-stat-chip toolbar-stat-chip-today">
              {doneVisibleTasks} færdig
              {doneVisibleTasks === 1 ? "" : "e"}
            </span>
          ) : null}
          {highPriorityVisibleTasks > 0 ? (
            <span className="toolbar-stat-chip toolbar-stat-chip-priority">
              {highPriorityVisibleTasks} høj prioritet
            </span>
          ) : null}
        </div>
        <div className="toolbar-actions">
          <button
            type="button"
            className={`ghost-button filter-chip ${filtersActive ? "filter-chip-active" : ""}`}
            onClick={onToggleFilters}
          >
            <span className="filter-chip-label">Filtre</span>
          </button>
          <button
            type="button"
            className="primary-button"
            disabled={busy || !projects.length}
            onClick={onOpenNewTask}
          >
            + Ny opgave
          </button>
        </div>
      </div>

      {showFilters ? (
        <div className="filter-panel">
          <select
            value={priorityFilter}
            onChange={(event) => onPriorityFilterChange(event.target.value)}
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
            onChange={(event) => onAssigneeFilterChange(event.target.value)}
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
            onClick={onResetFilters}
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
        <form className="new-task-panel" onSubmit={onSubmitNewTask}>
          <div className="new-task-grid">
            <label>
              <span className="field-label">
                Titel <span className="required-mark">*</span>
              </span>
              <input
                value={newTaskTitle}
                onChange={(event) => onNewTaskTitleChange(event.target.value)}
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
                onChange={(event) => onNewTaskProjectSlugChange(event.target.value)}
              >
                <option value="">
                  {hasWorkspace ? "Vælg projekt" : "Vælg arbejdsmappe først"}
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
                onChange={(event) => onNewTaskAssigneeChange(event.target.value)}
                placeholder="Navn (valgfrit)"
              />
            </label>
          </div>
          <div className="new-task-actions">
            <button
              type="button"
              className="ghost-button"
              onClick={onCancelNewTask}
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
  );
}

