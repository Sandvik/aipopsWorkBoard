import { useStrings, useLocale } from "../../app/i18n";
import { getTextCatalog } from "../../app/i18n/catalog";

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
  const { onboarding: t, board } = useStrings();
  const { locale } = useLocale();
  const ghost = getTextCatalog(locale).workspaceGhost;

  return (
    <div className="empty-main">
      <div className="empty-main-inner">
        <div className="board empty-main-ghost-board" aria-hidden="true">
          <div className="board-column ghost-column">
            <div className="column-header">
              <h2>{board.columnTitles.backlog}</h2>
            </div>
            <div className="column-body">
              <div className="task-card ghost-task">
                <div className="task-title">{ghost.backlog1}</div>
              </div>
              <div className="task-card ghost-task">
                <div className="task-title">{ghost.backlog2}</div>
              </div>
            </div>
          </div>
          <div className="board-column ghost-column">
            <div className="column-header">
              <h2>{board.columnTitles.todo}</h2>
            </div>
            <div className="column-body">
              <div className="task-card ghost-task">
                <div className="task-title">{ghost.todo1}</div>
              </div>
            </div>
          </div>
          <div className="board-column ghost-column">
            <div className="column-header">
              <h2>{board.columnTitles.doing}</h2>
            </div>
            <div className="column-body">
              <div className="task-card ghost-task">
                <div className="task-title">{ghost.doing1}</div>
              </div>
            </div>
          </div>
          <div className="board-column ghost-column">
            <div className="column-header">
              <h2>{board.columnTitles.done}</h2>
            </div>
            <div className="column-body">
              <div className="task-card ghost-task">
                <div className="task-title">{ghost.done1}</div>
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
