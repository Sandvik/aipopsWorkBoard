import type { ProjectRecord, TaskRecord } from "../../types";
import { isOverdue } from "../tasks/taskUi";
import { STRINGS, type Locale } from "../../app/i18n/locales";

export type WorkspaceViewModel = {
  activeProjects: ProjectRecord[];
  archivedProjects: ProjectRecord[];
  activeProjectSlugs: string[];
  allActiveTasks: TaskRecord[];
  workspaceProgressLabel: string;
  workspaceProgressTooltip: string;
  projectTooltips: Record<string, string>;
  projectTaskCounts: Record<string, number>;
  stats: {
    totalActiveTasks: number;
    totalDoneTasks: number;
    totalBacklogTasks: number;
    totalTodoTasks: number;
    totalDoingTasks: number;
  };
};

function getCurrentLocale(): Locale {
  if (typeof window === "undefined") return "en";
  const stored = window.localStorage.getItem("aipops.locale") as Locale | null;
  return stored === "da" || stored === "en" ? stored : "en";
}

export function buildWorkspaceViewModel(
  projects: ProjectRecord[],
  tasksByProject: Record<string, TaskRecord[]>,
): WorkspaceViewModel {
  const activeProjects = projects.filter((project) => !project.archived);
  const archivedProjects = projects.filter((project) => project.archived);

  const activeProjectSlugs = activeProjects.map((project) => project.slug);
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

  const strings = STRINGS[getCurrentLocale()];
  const pt = strings.projectTooltips;

  const projectTooltips: Record<string, string> = {};
  const projectTaskCounts: Record<string, number> = {};

  projects.forEach((project) => {
    const tasks = tasksByProject[project.slug] ?? [];
    projectTaskCounts[project.slug] = tasks.length;
    if (!tasks.length) {
      projectTooltips[project.slug] = pt.empty;
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
    const parts = [
      `${pt.prefixTotal}: ${tasks.length}`,
      `${pt.labelBacklog}: ${backlog}`,
      `${pt.labelTodo}: ${todo}`,
      `${pt.labelDoing}: ${doing}`,
      `${pt.labelDone}: ${done}`,
    ];
    if (overdue) {
      parts.push(`${pt.labelOverdue}: ${overdue}`);
    }
    if (highPriority) {
      parts.push(`${pt.labelHighPriority}: ${highPriority}`);
    }
    projectTooltips[project.slug] = parts.join(" \u00b7 ");
  });

  return {
    activeProjects,
    archivedProjects,
    activeProjectSlugs,
    allActiveTasks,
    workspaceProgressLabel,
    workspaceProgressTooltip,
    projectTooltips,
    projectTaskCounts,
    stats: {
      totalActiveTasks,
      totalDoneTasks,
      totalBacklogTasks,
      totalTodoTasks,
      totalDoingTasks,
    },
  };
}
