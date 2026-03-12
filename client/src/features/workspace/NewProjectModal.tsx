// Modal til at oprette et nyt projekt med navn.
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

  return (
    <div className="confirm-modal-backdrop">
      <div className="confirm-modal">
        <h2>Nyt projekt</h2>
        <p>Giv projektet et navn. Navnet skal være unikt i denne arbejdsmappe.</p>
        <div className="stack">
          <label>
            <span className="field-label">
              Projektnavn <span className="required-mark">*</span>
            </span>
            <input
              value={value}
              onChange={(event) => onChange(event.target.value)}
              autoFocus
              className={!value.trim() ? "input-invalid" : ""}
              placeholder="F.eks. Kundeprojekter, Personlige opgaver …"
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
            Annuller
          </button>
          <button
            type="button"
            className="primary-button"
            onClick={onCreate}
            disabled={busy || !value.trim()}
          >
            Opret projekt
          </button>
        </div>
      </div>
    </div>
  );
}

