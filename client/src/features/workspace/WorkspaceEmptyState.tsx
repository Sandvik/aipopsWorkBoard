// Tom-tilstand når ingen arbejdsmappe er valgt endnu.
// Viser kort forklaring og en knap til at vælge mappe.
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
          <h2>Få ét overblik over dine opgaver</h2>
          <p className="muted">
            AIPOPS Workboard er et enkelt board til dine projekter og opgaver – især dem, der
            starter som lange mails eller chats.
            <br />
            Alt gemmes som filer i en mappe på din egen computer – ingen servere, ingen login.
          </p>
          <ul className="empty-main-steps">
            <li>Vælg en arbejdsmappe til dine data (en almindelig mappe på din disk).</li>
            <li>Opret dit første projekt i sidebaren – arbejde, privat eller noget midt imellem.</li>
            <li>Tilføj opgaver og træk dem mellem kolonnerne (Backlog / Klar / I gang / Færdig).</li>
            <li>
              Får du opgaver via mail eller Teams? Kopiér emne og tekst ind i en ny opgave, og træk
              vedhæftninger hertil.
            </li>
          </ul>
          <pre className="muted small" style={{ marginTop: "0.6rem", marginBottom: "0.4rem" }}>
{`Fra tekst til board:

[ Mail / Teams ]  -->  [ To do | I gang | Færdig ]`}
          </pre>
          <p className="muted small">
            AI-hjælp til titler, beskrivelser og delopgaver er valgfrit. Hvis du vil bruge det, kan
            du senere tilføje din egen OpenAI-nøgle – dine opgaver gemmes stadig som filer i
            arbejds­mappen på din egen computer.
          </p>
          <label className="toggle tour-toggle">
            <input
              type="checkbox"
              checked={startTourAfterWorkspace}
              onChange={(event) => onStartTourToggle(event.target.checked)}
            />
            Vis en kort rundtur efter valg af mappe
          </label>
          <button
            type="button"
            className="primary-button"
            onClick={onPickWorkspace}
            disabled={busy}
          >
            Vælg mappe
          </button>
        </div>
      </div>
    </div>
  );
}

