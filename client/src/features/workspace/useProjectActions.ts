// Hook der samler al projekt-relateret domænelogik:
// - aktive/arkiverede projekter
// - opret/opdater/slet projekter (inkl. confirm-dialog og lokal state-oprydning)
import { useMemo } from "react";
import type { ProjectRecord, TaskRecord } from "../../types";
import { createProject, updateProject, deleteProject } from "../../infrastructure/storage";

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
    }, "Projekt oprettet.");
  }

  async function handleProjectUpdate(project: ProjectRecord, updates: Partial<ProjectRecord>) {
    await runAction(async () => {
      const handle = await requireWorkspace();
      const updated = await updateProject(handle, project.slug, updates);
      await loadAllData(handle, updated.slug, selectedTaskId);
    }, "Projekt gemt.");
  }

  async function handleProjectDelete(project: ProjectRecord) {
    setConfirmState({
      title: "Slet projekt",
      message: `Er du sikker på, at du vil slette projektet "${project.name}"? Alle opgaver i projektet bliver også slettet.`,
      confirmLabel: "Slet projekt",
      cancelLabel: "Annuller",
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
        }, "Projekt slettet.");
        setConfirmState(null);
      },
    });
  }

  return {
    activeProjects,
    archivedProjects,
    handleCreateProject,
    handleProjectUpdate,
    handleProjectDelete,
  };
}

