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
      <div className="empty-main-card">
        <h2>Vælg en arbejdsmappe for at komme i gang</h2>
        <p className="muted">
          AIPOPS Workboard er et board til dine projekter og opgaver.
          <br />
          Det gemmer alt som filer i en mappe på din egen computer – ingen servere, ingen login.
        </p>
        <ul className="empty-main-steps">
          <li>Vælg en arbejdsmappe til dine data</li>
          <li>Opret et projekt i sidebaren</li>
          <li>Tilføj opgaver og træk dem mellem kolonnerne</li>
        </ul>
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
  );
}

