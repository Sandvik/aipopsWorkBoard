// Domæne-helper til at hente alle projekter og tasks fra en arbejdsmappe
// og vælge "rigtigt" aktivt projekt og opgave.
import type { ProjectRecord, TaskRecord } from "../../types";
import { listProjects, listTasks } from "../../infrastructure/storage";

export type WorkspaceDataModel = {
  projects: ProjectRecord[];
  tasksByProject: Record<string, TaskRecord[]>;
  selectedProjectSlug: string;
  selectedTaskId: string;
};

export async function loadAllDataModel(
  handle: FileSystemDirectoryHandle,
  preferredProjectSlug?: string,
  preferredTaskId?: string | null,
): Promise<WorkspaceDataModel> {
  const nextProjects = await listProjects(handle);
  const entries = await Promise.all(
    nextProjects.map(async (project) => [project.slug, await listTasks(handle, project.slug)] as const),
  );
  const nextTasksByProject = Object.fromEntries(entries);
  const projectSlug = preferredProjectSlug && nextProjects.some((p) => p.slug === preferredProjectSlug)
    ? preferredProjectSlug
    : nextProjects[0]?.slug ?? "";
  const availableTasks = projectSlug ? nextTasksByProject[projectSlug] ?? [] : [];
  const taskId =
    preferredTaskId === null
      ? ""
      : preferredTaskId && availableTasks.some((task) => task.id === preferredTaskId)
        ? preferredTaskId
        : "";

  return {
    projects: nextProjects,
    tasksByProject: nextTasksByProject,
    selectedProjectSlug: projectSlug,
    selectedTaskId: taskId,
  };
}

