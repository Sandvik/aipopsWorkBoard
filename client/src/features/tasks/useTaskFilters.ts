// Hook der kapsler al filtreringslogik for opgaver:
// - søgetekst
// - prioritet/assignee-filtre
// - afledte værdier: visibleTasks, assignees, filtersActive.
import { useMemo, useState } from "react";
import type { TaskRecord } from "../../types";

type UseTaskFiltersArgs = {
  tasksByProject: Record<string, TaskRecord[]>;
  selectedProjectSlug: string;
};

export function useTaskFilters({ tasksByProject, selectedProjectSlug }: UseTaskFiltersArgs) {
  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [assigneeFilter, setAssigneeFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const visibleTasks = useMemo(() => {
    const tasks = selectedProjectSlug ? tasksByProject[selectedProjectSlug] ?? [] : [];
    return tasks.filter((task) => {
      if (
        search &&
        !`${task.title} ${task.description} ${task.assignee}`.toLowerCase().includes(search.toLowerCase())
      ) {
        return false;
      }
      if (priorityFilter && task.priority !== priorityFilter) return false;
      if (assigneeFilter && task.assignee !== assigneeFilter) return false;
      return true;
    });
  }, [assigneeFilter, priorityFilter, search, selectedProjectSlug, tasksByProject]);

  const assignees = useMemo(() => {
    const values = new Set(
      Object.values(tasksByProject)
        .flat()
        .map((task) => task.assignee.trim())
        .filter(Boolean),
    );
    return [...values].sort((a, b) => a.localeCompare(b));
  }, [tasksByProject]);

  const filtersActive = Boolean(priorityFilter || assigneeFilter);

  function resetFilters() {
    setSearch("");
    setPriorityFilter("");
    setAssigneeFilter("");
    setShowFilters(false);
  }

  return {
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
  };
}

