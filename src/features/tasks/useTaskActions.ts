import { useEffect, useMemo } from "react";
import type { ChangeEvent, FormEvent } from "react";
import type { ProjectRecord, TaskRecord, TaskStatus } from "../../types";
import type { PanelDraft } from "./taskUi";
import { normalizeDeadlineForInput } from "./taskUi";
import {
  addAttachment,
  addComment,
  createTask,
  deleteAttachment,
  deleteTask,
  moveTask,
  moveTaskToProject,
  readAttachmentFile,
  updateTask,
} from "../../infrastructure/storage";
import { useStrings } from "../../app/i18n";

type ConfirmState = {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void | Promise<void>;
};

type UseTaskActionsArgs = {
  projects: ProjectRecord[];
  tasksByProject: Record<string, TaskRecord[]>;
  selectedProjectSlug: string;
  selectedTaskId: string;
  panelDraft: PanelDraft;
  setPanelDraft: (draft: PanelDraft) => void;
  newTaskTitle: string;
  setNewTaskTitle: (value: string) => void;
  newTaskAssignee: string;
  setNewTaskAssignee: (value: string) => void;
  newTaskProjectSlug: string;
  setNewTaskProjectSlug: (value: string) => void;
  newTaskDescription: string;
  setNewTaskDescription: (value: string) => void;
  isCreatingTask: boolean;
  setIsCreatingTask: (value: boolean) => void;
  commentText: string;
  setCommentText: (value: string) => void;
  setTaskJustSaved: (value: boolean) => void;
  resetFilters: () => void;
  requireWorkspace: () => Promise<FileSystemDirectoryHandle>;
  runAction: (fn: () => Promise<void>, successMessage?: string) => Promise<void>;
  loadAllData: (
    handle: FileSystemDirectoryHandle,
    preferredProjectSlug?: string,
    preferredTaskId?: string | null,
  ) => Promise<void>;
  setError: (value: string) => void;
  setSelectedTaskId: (id: string) => void;
  setConfirmState: (state: ConfirmState | null) => void;
};

export function useTaskActions({
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
  setConfirmState,
}: UseTaskActionsArgs) {
  const { taskActions: text } = useStrings();

  const selectedTask = useMemo(() => {
    const allTasks = Object.values(tasksByProject).flat();
    return allTasks.find((task) => task.id === selectedTaskId) ?? null;
  }, [selectedTaskId, tasksByProject]);

  useEffect(() => {
    if (!selectedTask) {
      setPanelDraft({
        title: "",
        description: "",
        assignee: "",
        deadline: "",
        priority: "Medium",
        projectSlug: "",
        status: "backlog",
      });
      return;
    }
    setPanelDraft({
      title: selectedTask.title,
      description: selectedTask.description,
      assignee: selectedTask.assignee,
      deadline: normalizeDeadlineForInput(selectedTask.deadline),
      priority: selectedTask.priority,
      projectSlug: selectedTask.projectSlug,
      status: selectedTask.status,
    });
  }, [selectedTask, setPanelDraft]);

  async function handleCreateTask(event: FormEvent) {
    event.preventDefault();
    const targetProjectSlug = newTaskProjectSlug || selectedProjectSlug;
    if (!newTaskTitle.trim() || !targetProjectSlug) {
      setError(text.chooseProjectAndTitle);
      return;
    }
    await runAction(async () => {
      const handle = await requireWorkspace();
      const task = await createTask(handle, targetProjectSlug, {
        title: newTaskTitle,
        assignee: newTaskAssignee,
        description: newTaskDescription,
      });
      setNewTaskTitle("");
      setNewTaskAssignee("");
      setNewTaskProjectSlug("");
      setNewTaskDescription("");
      setIsCreatingTask(false);
      resetFilters();
      await loadAllData(handle, targetProjectSlug, task.id);
    }, text.created);
  }

  async function handleSaveTask() {
    if (!selectedTask) return;
    if (!panelDraft.title.trim() || !panelDraft.projectSlug) {
      setError(text.titleAndProjectRequired);
      return;
    }
    await runAction(async () => {
      const handle = await requireWorkspace();
      let targetProjectSlug = panelDraft.projectSlug;
      let targetTaskId = selectedTask.id;

      if (panelDraft.projectSlug !== selectedTask.projectSlug) {
        const movedTask = await moveTaskToProject(handle, selectedTask.projectSlug, selectedTask.id, {
          targetProjectSlug: panelDraft.projectSlug,
          status: panelDraft.status,
        });
        targetProjectSlug = movedTask.projectSlug;
        targetTaskId = movedTask.id;
      }

      const updated = await updateTask(handle, targetProjectSlug, targetTaskId, {
        title: panelDraft.title,
        description: panelDraft.description,
        assignee: panelDraft.assignee,
        deadline: panelDraft.deadline || null,
        priority: panelDraft.priority,
        status: panelDraft.status,
      });

      if (commentText.trim()) {
        await addComment(handle, updated.projectSlug, updated.id, commentText.trim());
        setCommentText("");
      }

      await loadAllData(handle, updated.projectSlug, updated.id);
      setSelectedTaskId("");
      setTaskJustSaved(true);
    });
  }

  async function handleAttachmentChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!selectedTask || !file) return;
    await runAction(async () => {
      const handle = await requireWorkspace();
      await addAttachment(handle, selectedTask.projectSlug, selectedTask.id, file);
      await loadAllData(handle, selectedTask.projectSlug, selectedTask.id);
    }, text.attachmentSaved);
    event.target.value = "";
  }

  async function handleAttachmentOpen(fileId: string) {
    if (!selectedTask) return;
    const attachment = selectedTask.attachments.find((entry) => entry.id === fileId);
    if (!attachment) return;
    await runAction(async () => {
      const handle = await requireWorkspace();
      const file = await readAttachmentFile(handle, selectedTask.projectSlug, selectedTask.id, attachment.storedName);
      const url = URL.createObjectURL(file);
      window.open(url, "_blank", "noopener,noreferrer");
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    });
  }

  async function handleAttachmentDelete(fileId: string) {
    if (!selectedTask) return;
    const task = selectedTask;
    const attachment = task.attachments.find((entry) => entry.id === fileId);
    if (!attachment) return;
    setConfirmState({
      title: text.deleteAttachmentTitle,
      message: text.deleteAttachmentMessage.replace("{name}", attachment.fileName),
      confirmLabel: text.deleteFile,
      cancelLabel: text.cancel,
      onConfirm: async () => {
        await runAction(async () => {
          const handle = await requireWorkspace();
          await deleteAttachment(handle, task.projectSlug, task.id, fileId);
          await loadAllData(handle, task.projectSlug, task.id);
        }, text.attachmentDeleted);
        setConfirmState(null);
      },
    });
  }

  async function handleTaskDelete() {
    if (!selectedTask) return;
    const task = selectedTask;
    setConfirmState({
      title: text.deleteTaskTitle,
      message: text.deleteTaskMessage.replace("{name}", task.title),
      confirmLabel: text.deleteTask,
      cancelLabel: text.cancel,
      onConfirm: async () => {
        await runAction(async () => {
          const handle = await requireWorkspace();
          await deleteTask(handle, task.projectSlug, task.id);
          await loadAllData(handle, task.projectSlug, null);
          setSelectedTaskId("");
        }, text.taskDeleted);
        setConfirmState(null);
      },
    });
  }

  async function handleTaskDrop(
    taskId: string,
    nextStatus: TaskStatus,
    orderedTaskIds: string[],
  ) {
    const allTasks = Object.values(tasksByProject).flat();
    const task = allTasks.find((entry) => entry.id === taskId);
    if (!task) return;
    if (task.status === nextStatus) return;

    await runAction(async () => {
      const handle = await requireWorkspace();
      await moveTask(handle, task.projectSlug, task.id, {
        status: nextStatus,
        orderedTaskIds,
      });
      await loadAllData(handle, task.projectSlug, null);
    });
  }

  return {
    selectedTask,
    isCreatingTask,
    handleCreateTask,
    handleSaveTask,
    handleAttachmentChange,
    handleAttachmentOpen,
    handleAttachmentDelete,
    handleTaskDelete,
    handleTaskDrop,
  };
}
