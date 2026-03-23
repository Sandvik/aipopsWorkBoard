// Præsentationskomponent for højre "Opgavedetaljer"-panel.
// Alt domænelogik (gem/validering/flytte opgave) ligger i App –
// her fokuserer vi på formularfelter og callbacks.
import type { ChangeEvent } from "react";
import type { ProjectRecord, TaskRecord, TaskPriority, TaskStatus } from "../../types";
import type { PanelDraft } from "./taskUi";
import { PRIORITY_LABELS } from "./taskUi";
import { useLocale, useStrings } from "../../i18n";
import { parseDeadline } from "./taskUi";

type TaskDetailsPanelProps = {
  // Den fulde task der redigeres.
  task: TaskRecord;
  // Projekter til projekt-dropdown (filtreret i komponenten).
  projects: ProjectRecord[];
  // Formular-udkast inde i panelet.
  draft: PanelDraft;
  // Tekst til ny kommentar nederst.
  commentText: string;
  // Busy-flag til at disable knapper under async handlinger.
  busy: boolean;
  // Bruges til kort "Opgaven er gemt."-feedback.
  taskJustSaved: boolean;
  // Lukkeknap øverst til højre.
  onClose: () => void;
  // Når et felt i formularen ændres.
  onDraftChange: (draft: PanelDraft) => void;
  // Når kommentar-tekst ændres.
  onCommentTextChange: (value: string) => void;
  // Brugeren trykker "Gem opgave".
  onSave: () => void;
  // Brugeren trykker "Slet opgave".
  onDelete: () => void;
  // Vedhæftnings-input ændrer sig (fil valgt).
  onAttachmentChange: (event: ChangeEvent<HTMLInputElement>) => void;
  // Klik på en vedhæftet fil.
  onAttachmentOpen: (id: string) => void;
  // Klik på "Slet" ved en vedhæftning.
  onAttachmentDelete: (id: string) => void;
  // AI-hjælp (kaldes fra App, viser modal hvis der mangler nøgle).
  onAiSummarizeDescription: () => void;
  aiBusy: boolean;
  aiLabel: string;
  onOpenAiSettings: () => void;
  canSplitFromDescription: boolean;
  onSplitFromDescription: () => void;
};

export function TaskDetailsPanel({
  task,
  projects,
  draft,
  commentText,
  busy,
  taskJustSaved,
  onClose,
  onDraftChange,
  onCommentTextChange,
  onSave,
  onDelete,
  onAttachmentChange,
  onAttachmentOpen,
  onAttachmentDelete,
  onAiSummarizeDescription,
  aiLabel,
  onOpenAiSettings,
  aiBusy,
  canSplitFromDescription,
  onSplitFromDescription,
}: TaskDetailsPanelProps) {
  const { taskPanel: t } = useStrings();
  const { locale } = useLocale();

  function getDeadlineDateTimeInputValues(value: string) {
    const parsed = parseDeadline(value);
    if (!parsed) return { date: "", time: "" };
    const year = parsed.getFullYear();
    const month = String(parsed.getMonth() + 1).padStart(2, "0");
    const day = String(parsed.getDate()).padStart(2, "0");
    const hours = String(parsed.getHours()).padStart(2, "0");
    const minutes = String(parsed.getMinutes()).padStart(2, "0");
    return {
      date: `${year}-${month}-${day}`,
      time: `${hours}:${minutes}`,
    };
  }

  const { date: deadlineDate, time: deadlineTime } = getDeadlineDateTimeInputValues(
    draft.deadline,
  );

  function combineDeadlineFromInputs(nextDate: string, nextTime: string) {
    if (!nextDate) return "";
    const time = nextTime || "09:00";
    return `${nextDate}T${time}`;
  }

  return (
    <aside className="task-panel">
      <div className="row between">
        <p className="eyebrow">{t.title}</p>
        <button
          type="button"
          className="ghost-button small-button"
          onClick={onClose}
          title={t.closeTitle}
        >
          {t.closeLabel}
        </button>
      </div>
      <div>
        <div className="stack">
          <label>
            <span className="field-label">
              {t.descriptionLabel} <span className="required-mark">*</span>
            </span>
            <input
              value={draft.title}
              onChange={(event) =>
                onDraftChange({
                  ...draft,
                  title: event.target.value,
                })
              }
              className={!draft.title.trim() ? "input-invalid" : ""}
            />
          </label>
          <label>
            {t.descriptionLabel}
            <textarea
              rows={3}
              value={draft.description}
              onChange={(event) =>
                onDraftChange({
                  ...draft,
                  description: event.target.value,
                })
              }
            />
          </label>
          <div className="ai-inline-actions">
            {canSplitFromDescription ? (
              <button
                type="button"
                className="ghost-button"
                onClick={onSplitFromDescription}
                disabled={busy || aiBusy}
                title="Lav flere konkrete opgaver ud fra den lange tekst i beskrivelsen"
              >
                {aiBusy ? "Laver opgave-forslag…" : "Lav konkrete opgaver ud fra teksten"}
              </button>
            ) : (
              <button
                type="button"
                className="ghost-button"
                onClick={onAiSummarizeDescription}
                disabled={busy || aiBusy}
                title="Få hjælp til at rydde op i teksten og gøre den mere konkret"
              >
                {aiBusy ? "Arbejder med tekst…" : aiLabel}
              </button>
            )}
          </div>
        </div>
      </div>

      <div>
        <p className="eyebrow">{t.basicsSectionTitle}</p>
        <div className="panel-grid">
          <label>
            {t.assigneeLabel}
            <input
              value={draft.assignee}
              onChange={(event) =>
                onDraftChange({
                  ...draft,
                  assignee: event.target.value,
                })
              }
            />
          </label>
          <label>
            {t.deadlineLabel}
            <div className="deadline-datetime-inputs">
              <input
                type="date"
                value={deadlineDate}
                onChange={(event) =>
                  onDraftChange({
                    ...draft,
                    deadline: combineDeadlineFromInputs(event.target.value, deadlineTime),
                  })
                }
              />
              <input
                type="time"
                step={60}
                value={deadlineTime}
                disabled={!deadlineDate}
                onChange={(event) =>
                  onDraftChange({
                    ...draft,
                    deadline: combineDeadlineFromInputs(deadlineDate, event.target.value),
                  })
                }
              />
            </div>
          </label>
          <label>
            {t.priorityLabel}
            <select
              value={draft.priority}
              onChange={(event) =>
                onDraftChange({
                  ...draft,
                  priority: event.target.value as TaskPriority,
                })
              }
            >
              {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label>
            {t.statusLabel}
            <select
              value={draft.status}
              onChange={(event) =>
                onDraftChange({
                  ...draft,
                  status: event.target.value as TaskStatus,
                })
              }
            >
              {(["backlog", "todo", "doing", "done"] as TaskStatus[]).map((status) => (
                <option key={status} value={status}>
                  {/** Board uses the same titles for columns and dropdown */}
                  {useStrings().board.columnTitles[status]}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="field-label">
              {t.projectLabel} <span className="required-mark">*</span>
            </span>
            <select
              value={draft.projectSlug}
              onChange={(event) =>
                onDraftChange({
                  ...draft,
                  projectSlug: event.target.value,
                })
              }
              className={!draft.projectSlug ? "input-invalid" : ""}
            >
              <option value="">{t.projectPlaceholder}</option>
              {projects
                .filter((project) => !project.archived)
                .map((project) => (
                  <option key={project.id} value={project.slug}>
                    {project.name}
                  </option>
                ))}
            </select>
          </label>
        </div>
      </div>

      <div>
        <p className="eyebrow">{t.attachmentsSectionTitle}</p>
        <label className="dropzone upload-button">
          {t.addFileLabel}
          <span className="form-note attachment-note">{t.attachmentNote}</span>
          <input type="file" onChange={onAttachmentChange} hidden />
        </label>
        <div className="stack">
          {task.attachments.map((attachment) => (
            <div key={attachment.id} className="attachment-row">
              <button
                type="button"
                className="ghost-button"
                onClick={() => onAttachmentOpen(attachment.id)}
              >
                {attachment.fileName}
              </button>
              <button
                type="button"
                className="ghost-button danger-button"
                onClick={() => onAttachmentDelete(attachment.id)}
                title={t.removeAttachmentTitle}
              >
                {t.deleteTaskLabel.split(" ")[0]}
              </button>
            </div>
          ))}
          {!task.attachments.length ? <div className="muted">{t.noAttachments}</div> : null}
        </div>
      </div>

      <div className="task-panel-footer">
        <p className="eyebrow">{t.commentsSectionTitle}</p>
        <div className="stack">
          <textarea
            rows={2}
            value={commentText}
            onChange={(event) => onCommentTextChange(event.target.value)}
            placeholder={t.commentPlaceholder}
          />
        </div>
        <div className="stack">
          {task.comments.map((comment) => (
            <div key={comment.id} className="comment-card">
              <strong>{comment.text}</strong>
              <span>
                {new Date(comment.createdAt).toLocaleString(
                  locale === "da" ? "da-DK" : "en-US",
                )}
              </span>
            </div>
          ))}
          {!task.comments.length ? <div className="muted">{t.noComments}</div> : null}
        </div>
      </div>

      <div className="task-panel-actions">
        <button
          type="button"
          className="ghost-button danger-button"
          onClick={onDelete}
          disabled={busy}
          title={t.deleteTaskTitle}
        >
          {t.deleteTaskLabel}
        </button>
        <div>
          <button
            type="button"
            className="primary-button task-save-button"
            onClick={onSave}
            disabled={busy || !draft.title.trim() || !draft.projectSlug}
            title={t.saveTaskTitle}
          >
            {t.saveTaskLabel}
          </button>
          {taskJustSaved && <p className="muted small">{t.taskSavedMessage}</p>}
        </div>
      </div>
    </aside>
  );
}

