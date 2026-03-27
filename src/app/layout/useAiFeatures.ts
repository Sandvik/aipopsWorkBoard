import { useState } from "react";
import type { PanelDraft } from "../../features/tasks/taskUi";
import type { ProjectRecord, TaskRecord } from "../../types";
import {
  generateMorningBrief,
  optimizeTaskTitle,
  splitIntoTasks,
  summarizeDescription,
  summarizeDescriptionFromMessage,
  suggestTaskDescription,
  type SplitTaskSuggestion,
} from "../../infrastructure/aiClient";
import { looksLikeMailOrChat, ensureNonEmptyText } from "../../features/tasks/aiHelpers";
import { parseDeadline } from "../../features/tasks/taskUi";
import { useLocale, useStrings } from "../i18n";

type WorkspaceAiContext = {
  projects: ProjectRecord[];
  tasksByProject: Record<string, TaskRecord[]>;
  activeProjects: ProjectRecord[];
  selectedProjectSlug: string;
};

type TaskAiContext = {
  selectedTask: TaskRecord | null;
  panelDraft: PanelDraft;
  setPanelDraft: (next: PanelDraft) => void;
};

type NewTaskAiContext = {
  title: string;
  description: string;
  projectSlug: string;
  setDescription: (value: string) => void;
};

type UseAiFeaturesArgs = {
  aiApiKey: string | null;
  workspace: WorkspaceAiContext;
  task: TaskAiContext;
  newTask: NewTaskAiContext;
  setMessage: (value: string) => void;
  runAction: (fn: () => Promise<void>) => Promise<void>;
};

export function useAiFeatures({
  aiApiKey,
  workspace,
  task,
  newTask,
  setMessage,
  runAction,
}: UseAiFeaturesArgs) {
  const { locale } = useLocale();
  const { aiFlow: text } = useStrings();
  const [aiBusy, setAiBusy] = useState(false);
  const [morningBrief, setMorningBrief] = useState("");
  const [showMorningBrief, setShowMorningBrief] = useState(false);
  const [splitSuggestions, setSplitSuggestions] = useState<SplitTaskSuggestion[]>([]);
  const [showSplitModal, setShowSplitModal] = useState(false);
  const [splitProjectSlug, setSplitProjectSlug] = useState<string>("");
  const [canSplitCurrentDescription, setCanSplitCurrentDescription] = useState(false);
  const [canSplitNewTaskDescription, setCanSplitNewTaskDescription] = useState(false);

  function requireApiKey(onRequire: () => void) {
    if (!aiApiKey) {
      onRequire();
      return false;
    }
    return true;
  }

  async function handleMorningBrief(onRequireKey: () => void) {
    if (!requireApiKey(onRequireKey)) return;
    setMorningBrief(text.generatingBrief);
    setShowMorningBrief(true);

    const lines: string[] = [];
    const today = new Date();
    const dateLocale = locale === "da" ? "da-DK" : "en-US";
    const todayLabel = today.toLocaleDateString(dateLocale, {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    lines.push(`${text.date}: ${todayLabel}`);
    lines.push("");
    workspace.activeProjects.forEach((project) => {
      const tasks = workspace.tasksByProject[project.slug] ?? [];
      if (!tasks.length) return;
      const openTasks = tasks.filter((task) => task.status !== "done");
      const backlog = tasks.filter((task) => task.status === "backlog").length;
      const todo = tasks.filter((task) => task.status === "todo").length;
      const doing = tasks.filter((task) => task.status === "doing").length;
      const done = tasks.filter((task) => task.status === "done").length;
      const overdue = openTasks.filter(
        (task) => task.deadline && new Date(task.deadline) < today,
      ).length;
      const highPriority = openTasks.filter(
        (task) => task.priority === "High" || task.priority === "Critical",
      ).length;
      lines.push(
        `${text.project}: ${project.name} - ${text.tasksTotal}: ${tasks.length}, ${text.backlog}: ${backlog}, ${text.todo}: ${todo}, ${text.doing}: ${doing}, ${text.done}: ${done}, ${text.overdue}: ${overdue}, ${text.highPriority}: ${highPriority}`,
      );
      const importantTasks = openTasks
        .filter(
          (task) =>
            (task.deadline && new Date(task.deadline) < today) ||
            task.priority === "High" ||
            task.priority === "Critical" ||
            task.status === "doing",
        )
        .slice(0, 3);
      importantTasks.forEach((taskItem) => {
        const statusLabel =
          taskItem.status === "backlog"
            ? text.backlog
            : taskItem.status === "todo"
              ? text.todo
              : taskItem.status === "doing"
                ? text.doing
                : text.done;
        const deadlineText = taskItem.deadline
          ? `, ${text.deadline}: ${(() => {
              const parsed = parseDeadline(taskItem.deadline);
              return parsed
                ? parsed.toLocaleString(dateLocale, {
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : taskItem.deadline;
            })()}`
          : "";
        lines.push(`- [${statusLabel}] ${taskItem.title}${deadlineText}`);
      });
      lines.push("");
    });

    const context = lines.join("\n");

    setAiBusy(true);
    try {
      await runAction(async () => {
        const brief = await generateMorningBrief({
          apiKey: aiApiKey as string,
          context,
        });
        setMorningBrief(brief);
      });
    } finally {
      setAiBusy(false);
    }
  }

  async function handleAiSuggestNewTaskDescription(onRequireKey: () => void) {
    if (!requireApiKey(onRequireKey)) return;
    if (!newTask.title && !newTask.description) {
      setMessage(text.needTitleOrText);
      return;
    }
    setAiBusy(true);
    try {
      await runAction(async () => {
        const looksLikeMessage = looksLikeMailOrChat(newTask.description);
        if (looksLikeMessage) {
          const result = await summarizeDescriptionFromMessage({
            apiKey: aiApiKey as string,
            text: newTask.description,
          });
          newTask.setDescription(result.shorter);
        } else {
          const suggestion = await suggestTaskDescription({
            apiKey: aiApiKey as string,
            title: newTask.title,
            currentDescription: newTask.description,
          });
          newTask.setDescription(suggestion);
        }
        setCanSplitNewTaskDescription(true);
      });
    } finally {
      setAiBusy(false);
    }
  }

  async function handleAiSummarizeExisting(onRequireKey: () => void) {
    if (!requireApiKey(onRequireKey)) return;
    const baseText = task.panelDraft.description.trim() || task.panelDraft.title.trim();
    const textInput = ensureNonEmptyText(baseText, setMessage);
    if (!textInput) return;

    const looksLikeMessage = looksLikeMailOrChat(task.panelDraft.description);
    const isVeryShortDescription =
      !looksLikeMessage &&
      task.panelDraft.description.trim().length > 0 &&
      task.panelDraft.description.trim().length < 40;

    setAiBusy(true);
    try {
      await runAction(async () => {
        let resultText: string;
        if (looksLikeMessage) {
          const result = await summarizeDescriptionFromMessage({
            apiKey: aiApiKey as string,
            text: textInput,
          });
          resultText = result.shorter;
        } else if (isVeryShortDescription) {
          const suggestion = await suggestTaskDescription({
            apiKey: aiApiKey as string,
            title: task.panelDraft.title,
            currentDescription: task.panelDraft.description,
          });
          resultText = suggestion;
        } else {
          const result = await summarizeDescription({
            apiKey: aiApiKey as string,
            text: textInput,
          });
          resultText = result.shorter;
        }

        let nextDraft: PanelDraft = {
          ...task.panelDraft,
          description: resultText,
        };

        try {
          const optimizedTitle = await optimizeTaskTitle({
            apiKey: aiApiKey as string,
            title: nextDraft.title || task.selectedTask?.title || "",
            description: nextDraft.description,
            deadlineLabel: nextDraft.deadline || undefined,
          });
          if (optimizedTitle && optimizedTitle.trim()) {
            nextDraft = {
              ...nextDraft,
              title: optimizedTitle.trim(),
            };
          }
        } catch (optError) {
          console.warn(text.couldNotOptimizeTitle, optError);
        }
        task.setPanelDraft(nextDraft);
        setCanSplitCurrentDescription(looksLikeMessage);
      });
    } finally {
      setAiBusy(false);
    }
  }

  async function handleSplitFromDescription(onRequireKey: () => void) {
    if (!requireApiKey(onRequireKey)) return;
    const textInput = ensureNonEmptyText(
      task.panelDraft.description,
      setMessage,
      text.addDescriptionText,
    );
    if (!textInput) return;

    setAiBusy(true);
    try {
      await runAction(async () => {
        const suggestions = await splitIntoTasks({
          apiKey: aiApiKey as string,
          text: textInput,
        });

        if (!suggestions.length) {
          setMessage(text.noTasksFound);
          return;
        }

        const projectSlug =
          task.panelDraft.projectSlug || task.selectedTask?.projectSlug || workspace.selectedProjectSlug;
        setSplitProjectSlug(projectSlug);
        setSplitSuggestions(suggestions);
        setShowSplitModal(true);
      });
    } finally {
      setAiBusy(false);
    }
  }

  async function handleSplitFromNewTaskDescription(onRequireKey: () => void) {
    if (!requireApiKey(onRequireKey)) return;
    const textInput = ensureNonEmptyText(
      newTask.description,
      setMessage,
      text.addDescriptionText,
    );
    if (!textInput) return;

    setAiBusy(true);
    try {
      await runAction(async () => {
        const suggestions = await splitIntoTasks({
          apiKey: aiApiKey as string,
          text: textInput,
        });

        if (!suggestions.length) {
          setMessage(text.noTasksFound);
          return;
        }

        setSplitProjectSlug(newTask.projectSlug || workspace.selectedProjectSlug);
        setSplitSuggestions(suggestions);
        setShowSplitModal(true);
      });
    } finally {
      setAiBusy(false);
    }
  }

  return {
    aiBusy,
    morningBrief,
    showMorningBrief,
    setShowMorningBrief,
    splitSuggestions,
    showSplitModal,
    setShowSplitModal,
    splitProjectSlug,
    canSplitCurrentDescription,
    setCanSplitCurrentDescription,
    canSplitNewTaskDescription,
    setCanSplitNewTaskDescription,
    handleMorningBrief,
    handleAiSuggestNewTaskDescription,
    handleAiSummarizeExisting,
    handleSplitFromDescription,
    handleSplitFromNewTaskDescription,
  };
}
