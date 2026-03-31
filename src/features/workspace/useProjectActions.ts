import { useMemo } from "react";
import type { ProjectRecord, TaskRecord } from "../../types";
import {
  createProject,
  updateProject,
  deleteProject,
  reorderProjects,
} from "../../infrastructure/storage";
import { useStrings } from "../../app/i18n";

type ConfirmState = {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void | Promise<void>;
};

type UseProjectActionsArgs = {
  projects: ProjectRecord[];
  tasksByProject: Record<string, TaskRecord[]>;
  selectedProjectSlug: string;
  selectedTask: TaskRecord | null;
  selectedTaskId: string;
  requireWorkspace: () => Promise<FileSystemDirectoryHandle>;
  runAction: (fn: () => Promise<void>, successMessage?: string) => Promise<void>;
  loadAllData: (
    handle: FileSystemDirectoryHandle,
    preferredProjectSlug?: string,
    preferredTaskId?: string | null,
  ) => Promise<void>;
  setProjects: (projects: ProjectRecord[] | ((prev: ProjectRecord[]) => ProjectRecord[])) => void;
  setTasksByProject: (
    value:
      | Record<string, TaskRecord[]>
      | ((prev: Record<string, TaskRecord[]>) => Record<string, TaskRecord[]>),
  ) => void;
  setSelectedProjectSlug: (slug: string) => void;
  setSelectedTaskId: (id: string) => void;
  setConfirmState: (state: ConfirmState | null) => void;
  setNewProjectName: (value: string) => void;
};

export function useProjectActions({
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
}: UseProjectActionsArgs) {
  const { projectActions: text } = useStrings();

  const activeProjects = useMemo(
    () => projects.filter((project) => !project.archived),
    [projects],
  );

  const archivedProjects = useMemo(
    () => projects.filter((project) => project.archived),
    [projects],
  );

  async function handleCreateProject(name: string) {
    const trimmed = name.trim();
    if (!trimmed) return;
    await runAction(async () => {
      const handle = await requireWorkspace();
      const project = await createProject(handle, { name: trimmed });
      setNewProjectName("");
      await loadAllData(handle, project.slug);
    }, text.created);
  }

  async function handleProjectUpdate(project: ProjectRecord, updates: Partial<ProjectRecord>) {
    await runAction(async () => {
      const handle = await requireWorkspace();
      const updated = await updateProject(handle, project.slug, updates);
      await loadAllData(handle, updated.slug, selectedTaskId);
    }, text.saved);
  }

  async function handleProjectDelete(project: ProjectRecord) {
    setConfirmState({
      title: text.deleteTitle,
      message: text.deleteMessage.replace("{name}", project.name),
      confirmLabel: text.deleteLabel,
      cancelLabel: text.cancel,
      onConfirm: async () => {
        await runAction(async () => {
          const handle = await requireWorkspace();
          await deleteProject(handle, project.slug);
          const remainingProjects = projects.filter((entry) => entry.slug !== project.slug);
          const nextSelectedProjectSlug =
            selectedProjectSlug === project.slug ? (remainingProjects[0]?.slug ?? "") : selectedProjectSlug;
          const nextTasksByProject = Object.fromEntries(
            Object.entries(tasksByProject).filter(([slug]) => slug !== project.slug),
          );
          const nextSelectedTaskId =
            selectedTask?.projectSlug === project.slug
              ? ""
              : selectedTaskId;

          setProjects(remainingProjects);
          setTasksByProject(nextTasksByProject);
          setSelectedProjectSlug(nextSelectedProjectSlug);
          setSelectedTaskId(nextSelectedTaskId);

          await loadAllData(handle, nextSelectedProjectSlug || undefined, nextSelectedTaskId || null);
        }, text.deleted);
        setConfirmState(null);
      },
    });
  }

  async function handleProjectReorder(nextProjects: ProjectRecord[]) {
    const normalizedProjects = nextProjects.map((project, index) => ({
      ...project,
      order: index,
    }));
    setProjects(normalizedProjects);
    await runAction(async () => {
      const handle = await requireWorkspace();
      await reorderProjects(
        handle,
        normalizedProjects.map((project) => project.slug),
      );
      await loadAllData(handle, selectedProjectSlug || normalizedProjects[0]?.slug || undefined, selectedTaskId);
    });
  }

  return {
    activeProjects,
    archivedProjects,
    handleCreateProject,
    handleProjectUpdate,
    handleProjectDelete,
    handleProjectReorder,
  };
}
