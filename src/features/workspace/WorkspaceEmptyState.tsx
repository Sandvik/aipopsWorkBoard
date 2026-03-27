// Tom-tilstand når ingen arbejdsmappe er valgt endnu.
// Viser kort forklaring og en knap til at vælge mappe.
import { useStrings } from "../../app/i18n";
type WorkspaceEmptyStateProps = {
  startTourAfterWorkspace: boolean;
  busy: boolean;
  onStartTourToggle: (checked: boolean) => void;
  onPickWorkspace: () => void;
};

export function WorkspaceEmptyState({
  startTourAfterWorkspace,
  busy,
  onStartTourToggle,
  onPickWorkspace,
}: WorkspaceEmptyStateProps) {
  const { onboarding: t } = useStrings();
  return (
    <div className="empty-main">
      <div className="empty-main-inner">
        <div className="board empty-main-ghost-board" aria-hidden="true">
          <div className="board-column ghost-column">
            <div className="column-header">
              <h2>Backlog</h2>
            </div>
            <div className="column-body">
              <div className="task-card ghost-task">
                <div className="task-title">Læs lang mail fra kunden</div>
              </div>
              <div className="task-card ghost-task">
                <div className="task-title">Lav overblik over næste uge</div>
              </div>
            </div>
          </div>
          <div className="board-column ghost-column">
            <div className="column-header">
              <h2>Klar</h2>
            </div>
            <div className="column-body">
              <div className="task-card ghost-task">
                <div className="task-title">Plan for projekt X</div>
              </div>
            </div>
          </div>
          <div className="board-column ghost-column">
            <div className="column-header">
              <h2>I gang</h2>
            </div>
            <div className="column-body">
              <div className="task-card ghost-task">
                <div className="task-title">Opfølgning med teamet</div>
              </div>
            </div>
          </div>
          <div className="board-column ghost-column">
            <div className="column-header">
              <h2>Færdig</h2>
            </div>
            <div className="column-body">
              <div className="task-card ghost-task">
                <div className="task-title">Svar sendt til leder</div>
              </div>
            </div>
          </div>
        </div>

        <div className="empty-main-card">
          <h2>{t.title}</h2>
          <p className="muted">
            {t.introLine1}
            <br />
            {t.introLine2}
          </p>
          <ul className="empty-main-steps">
            {t.steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ul>
          <pre className="muted small" style={{ marginTop: "0.6rem", marginBottom: "0.4rem" }}>
            {t.asciiHint}
          </pre>
          <p className="muted small">{t.aiNote}</p>
          <label className="toggle tour-toggle">
            <input
              type="checkbox"
              checked={startTourAfterWorkspace}
              onChange={(event) => onStartTourToggle(event.target.checked)}
            />
            {t.tourLabel}
          </label>
          <button
            type="button"
            className="primary-button"
            onClick={onPickWorkspace}
            disabled={busy}
          >
            {t.chooseFolderButton}
          </button>
        </div>
      </div>
    </div>
  );
}

