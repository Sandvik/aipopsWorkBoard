// UI-hjælpere og typer til task-delen af appen.
// Her samles labels, default-drafts og små formateringsfunktioner,
// så både board og detaljer-panel kan genbruge dem.
import type { TaskPriority, TaskStatus } from "../../types";
import { STRINGS, type Locale } from "../../app/i18n/locales";

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

function isDateOnlyValue(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function toLocalDateTimeInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export function normalizeDeadlineForInput(value: string | null) {
  if (!value) return "";
  if (isDateOnlyValue(value)) {
    return `${value}T09:00`;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return toLocalDateTimeInputValue(parsed);
}

export function parseDeadline(value: string | null) {
  if (!value) return null;
  if (isDateOnlyValue(value)) {
    const parsed = new Date(`${value}T00:00`);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

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
  const parsed = parseDeadline(value);
  if (!parsed) return noDeadlineLabel;
  if (isDateOnlyValue(value)) {
    return parsed.toLocaleDateString(dateLocale);
  }
  return parsed.toLocaleString(dateLocale, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Bruges til at style deadlines, der ligger før dags dato, som "forfaldne".
export function isOverdue(value: string | null) {
  if (!value) return false;
  const parsed = parseDeadline(value);
  if (!parsed) return false;
  const now = new Date();
  if (isDateOnlyValue(value)) {
    const dayEnd = new Date(parsed);
    dayEnd.setHours(23, 59, 59, 999);
    return now > dayEnd;
  }
  return now > parsed;
}

