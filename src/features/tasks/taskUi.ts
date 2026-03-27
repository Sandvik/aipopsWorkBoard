import type { TaskPriority, TaskStatus } from "../../types";
import { STRINGS } from "../../app/i18n/locales";
import { getStoredLocale, getStoredTextCatalog } from "../../app/i18n/catalog";
import { getStoredTextCatalog } from "../../app/i18n/catalog";

export type PanelDraft = {
  title: string;
  description: string;
  assignee: string;
  deadline: string;
  priority: TaskPriority;
  projectSlug: string;
  status: TaskStatus;
};

export const STATUS_LABELS: Record<TaskStatus, string> = {
  backlog: "Backlog",
  todo: "Ready",
  doing: "Doing",
  done: "Done",
};

export function getPriorityLabels(): Record<TaskPriority, string> {
  const labels = getStoredTextCatalog().priorityLabels;
  return {
    Low: labels.low,
    Medium: labels.medium,
    High: labels.high,
    Critical: labels.critical,
  };
}

export const PRIORITY_LABELS = getPriorityLabels();

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

function getCurrentLocaleForDate() {
  return getStoredLocale();
}

export function formatDate(value: string | null) {
  const { date } = STRINGS[getCurrentLocaleForDate()];
  const dateLocale = date?.dateLocale ?? "en-US";
  const noDeadlineLabel = date?.noDeadlineLabel ?? "No due date";
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
