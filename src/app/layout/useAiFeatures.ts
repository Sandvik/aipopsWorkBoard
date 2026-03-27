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
    setMorningBrief("Genererer brief…");
    setShowMorningBrief(true);

    const lines: string[] = [];
    const today = new Date();
    const todayLabel = today.toLocaleDateString("da-DK", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    lines.push(`Dato: ${todayLabel}`);
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
        `Projekt: ${project.name} – Opgaver i alt: ${tasks.length}, Backlog: ${backlog}, Klar: ${todo}, I gang: ${doing}, Færdige: ${done}, Forsinkede: ${overdue}, Høj prioritet: ${highPriority}`,
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
      importantTasks.forEach((task) => {
        const statusLabel =
          task.status === "backlog"
            ? "Backlog"
            : task.status === "todo"
              ? "Klar"
              : task.status === "doing"
                ? "I gang"
                : "Færdig";
        const deadlineText = task.deadline
          ? `, frist: ${(() => {
              const parsed = parseDeadline(task.deadline);
              return parsed
                ? parsed.toLocaleString("da-DK", {
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : task.deadline;
            })()}`
          : "";
        lines.push(`- [${statusLabel}] ${task.title}${deadlineText}`);
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
      setMessage("Skriv mindst en titel eller lidt tekst først.");
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
    const text = ensureNonEmptyText(baseText, setMessage);
    if (!text) return;

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
            text,
          });
          resultText = result.shorter;
        } else if (isVeryShortDescription) {
          // Meget kort tekst – brug samme logik som "hjælp til beskrivelse"
          const suggestion = await suggestTaskDescription({
            apiKey: aiApiKey as string,
            title: task.panelDraft.title,
            currentDescription: task.panelDraft.description,
          });
          resultText = suggestion;
        } else {
          const result = await summarizeDescription({
            apiKey: aiApiKey as string,
            text,
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
          // eslint-disable-next-line no-console
          console.warn("Kunne ikke optimere titel", optError);
        }
        task.setPanelDraft(nextDraft);
        // Kun aktiver "Lav konkrete opgaver..." hvis teksten faktisk lignede en mail/chat.
        setCanSplitCurrentDescription(looksLikeMessage);
      });
    } finally {
      setAiBusy(false);
    }
  }

  async function handleSplitFromDescription(onRequireKey: () => void) {
    if (!requireApiKey(onRequireKey)) return;
    const text = ensureNonEmptyText(
      task.panelDraft.description,
      setMessage,
      "Tilføj lidt tekst i beskrivelsen først.",
    );
    if (!text) return;

    setAiBusy(true);
    try {
      await runAction(async () => {
        const suggestions = await splitIntoTasks({
          apiKey: aiApiKey as string,
          text,
        });

        if (!suggestions.length) {
          setMessage(
            "Jeg kunne ikke finde tydelige opgaver i teksten. Prøv at gøre teksten lidt kortere.",
          );
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
    const text = ensureNonEmptyText(
      newTask.description,
      setMessage,
      "Tilføj lidt tekst i beskrivelsen først.",
    );
    if (!text) return;

    setAiBusy(true);
    try {
      await runAction(async () => {
        const suggestions = await splitIntoTasks({
          apiKey: aiApiKey as string,
          text,
        });

        if (!suggestions.length) {
          setMessage(
            "Jeg kunne ikke finde tydelige opgaver i teksten. Prøv at gøre teksten lidt kortere.",
          );
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
