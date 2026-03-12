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
          AIPOPS Workboard gemmer alle projekter og opgaver lokalt i den mappe du vælger.
        </p>
        <label className="toggle tour-toggle">
          <input
            type="checkbox"
            checked={startTourAfterWorkspace}
            onChange={(event) => onStartTourToggle(event.target.checked)}
          />
          Vis en kort rundtur efter valg
        </label>
        <button
          type="button"
          className="primary-button"
          onClick={onPickWorkspace}
          disabled={busy}
        >
          Vælg arbejdsmappe
        </button>
      </div>
    </div>
  );
}

