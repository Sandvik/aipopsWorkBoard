// UI-hjælpere og typer til task-delen af appen.
// Her samles labels, default-drafts og små formateringsfunktioner,
// så både board og detaljer-panel kan genbruge dem.
import type { TaskPriority, TaskStatus } from "../../types";
import { STRINGS, type Locale } from "../../i18n/locales";

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

function getCurrentLocaleForDate(): Locale {
  if (typeof window === "undefined") return "en";
  const stored = window.localStorage.getItem("aipops.locale") as Locale | null;
  return stored === "da" || stored === "en" ? stored : "en";
}

export function formatDate(value: string | null) {
  const { date } = STRINGS[getCurrentLocaleForDate()];
  const dateLocale = date?.dateLocale ?? "da-DK";
  const noDeadlineLabel = date?.noDeadlineLabel ?? "Ingen frist";
  if (!value) return noDeadlineLabel;
  return new Date(value).toLocaleDateString(dateLocale);
}

// Bruges til at style deadlines, der ligger før dags dato, som "forfaldne".
export function isOverdue(value: string | null) {
  return Boolean(value && new Date(value) < new Date(new Date().toDateString()));
}

