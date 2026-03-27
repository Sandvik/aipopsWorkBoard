// Modal til at oprette et nyt projekt med navn.
import { useStrings } from "../../app/i18n";

type NewProjectModalProps = {
  open: boolean;
  value: string;
  busy: boolean;
  onChange: (value: string) => void;
  onCancel: () => void;
  onCreate: () => void;
};

export function NewProjectModal({ open, value, busy, onChange, onCancel, onCreate }: NewProjectModalProps) {
  if (!open) return null;

  const { sidebar: s } = useStrings();

  return (
    <div className="confirm-modal-backdrop">
      <div className="confirm-modal">
        <h2>{s.newProjectTitle}</h2>
        <p>{s.newProjectDescription}</p>
        <div className="stack">
          <label>
            <span className="field-label">
              {s.newProjectFieldLabel} <span className="required-mark">*</span>
            </span>
            <input
              value={value}
              onChange={(event) => onChange(event.target.value)}
              autoFocus
              className={!value.trim() ? "input-invalid" : ""}
              placeholder={s.newProjectPlaceholder}
            />
          </label>
        </div>
        <div className="confirm-modal-actions">
          <button
            type="button"
            className="ghost-button"
            onClick={onCancel}
            disabled={busy}
          >
            {s.newProjectCancelLabel}
          </button>
          <button
            type="button"
            className="primary-button"
            onClick={onCreate}
            disabled={busy || !value.trim()}
          >
            {s.newProjectCreateLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
