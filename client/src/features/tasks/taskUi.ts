// UI-hjælpere og typer til task-delen af appen.
// Her samles labels, default-drafts og små formateringsfunktioner,
// så både board og detaljer-panel kan genbruge dem.
import type { TaskPriority, TaskStatus } from "../../types";

// Lokalt udkast til en task, mens brugeren redigerer i detaljer-panelet.
// Dette er adskilt fra TaskRecord, så vi kan håndtere strings i formularfelter.
export type PanelDraft = {
  title: string;
  description: string;
  assignee: string;
  deadline: string;
  priority: TaskPriority;
  projectSlug: string;
  status: TaskStatus;
};

// Menneskelige labels til status-værdier.
export const STATUS_LABELS: Record<TaskStatus, string> = {
  backlog: "Backlog",
  todo: "Klar",
  doing: "I gang",
  done: "Færdig",
};

// Menneskelige labels til prioritet-værdier.
export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  Low: "Lav",
  Medium: "Mellem",
  High: "Høj",
  Critical: "Kritisk",
};

// Start-værdier til detaljer-panelet, når ingen task er valgt.
export const EMPTY_DRAFT: PanelDraft = {
  title: "",
  description: "",
  assignee: "",
  deadline: "",
  priority: "Medium",
  projectSlug: "",
  status: "backlog",
};

// Viser deadlines i dansk datoformat eller en fallback-tekst.
export function formatDate(value: string | null) {
  if (!value) return "Ingen frist";
  return new Date(value).toLocaleDateString("da-DK");
}

// Bruges til at style deadlines, der ligger før dags dato, som "forfaldne".
export function isOverdue(value: string | null) {
  return Boolean(value && new Date(value) < new Date(new Date().toDateString()));
}

