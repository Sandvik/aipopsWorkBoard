// Venstre sidebar med brand, arbejdsmappe-info og projektliste.
// Alle side-effekter (valg af mappe, reload, slet projekt) håndteres via callbacks.
import type { ProjectRecord } from "../../types";

type WorkspaceSidebarProps = {
  hasWorkspace: boolean;
  workspaceName: string;
  busy: boolean;
  projects: ProjectRecord[];
  activeProjects: ProjectRecord[];
  archivedProjects: ProjectRecord[];
  selectedProjectSlug: string;
  onPickWorkspace: () => void;
  onRefreshData: () => void;
  onCreateProject: () => void;
  onSelectProject: (slug: string) => void;
  onDeleteProject: (project: ProjectRecord) => void;
};

export function WorkspaceSidebar({
  hasWorkspace,
  workspaceName,
  busy,
  projects,
  activeProjects,
  archivedProjects,
  selectedProjectSlug,
  onPickWorkspace,
  onRefreshData,
  onCreateProject,
  onSelectProject,
  onDeleteProject,
}: WorkspaceSidebarProps) {
  return (
    <aside className="left-rail">
      <div className="app-brand">
        <span className="app-brand-name">AIPOPS Workboard</span>
        <p className="muted small">Opgaver og projekter</p>
      </div>
      {hasWorkspace ? (
        <>
          <div className="workspace-card">
            <p className="eyebrow">Arbejdsmappe</p>
            <p className="workspace-name" title={workspaceName || undefined}>
              {workspaceName || "Ingen mappe valgt"}
            </p>
            <div className="workspace-actions">
              <button
                type="button"
                className="primary-button"
                onClick={onPickWorkspace}
                disabled={busy}
                title={workspaceName ? "Skift til en anden arbejdsmappe" : "Vælg en arbejdsmappe for at komme i gang"}
              >
                {workspaceName ? "Skift mappe" : "Vælg mappe"}
              </button>
            </div>
            <div>
              <button
                type="button"
                className="secondary-button"
                onClick={onRefreshData}
                disabled={busy}
                title="Ved delt mappe: klik for at hente andre brugeres ændringer"
              >
                Opdater
              </button>
            </div>
            <p className="workspace-shared-hint muted small">
            
            </p>
          </div>

          <div className="workspace-card projects-card">
            <div className="projects-head-row">
              <div>
                <p className="eyebrow">Projekter</p>
               
                <button
                  type="button"
                  className="primary-button"
                  disabled={busy || !hasWorkspace}
                  onClick={onCreateProject}
                title="Opret et nyt projekt i den valgte arbejdsmappe"
                >
                  + Nyt projekt
                </button>
              </div>
            </div>

            <div className="project-list">
              <p className="project-section-label">Aktive projekter</p>
              {activeProjects.map((project) => (
                <button
                  key={project.id}
                  type="button"
                  className={`project-list-item ${
                    selectedProjectSlug === project.slug ? "project-list-item-active" : ""
                  }`}
                  onClick={() => onSelectProject(project.slug)}
                >
                  <span className="project-list-text">
                    <span className="project-list-name">{project.name}</span>
                    {selectedProjectSlug === project.slug && (
                      <span className="project-list-meta">Aktivt projekt</span>
                    )}
                  </span>
                </button>
              ))}
              {!activeProjects.length ? (
                <p className="muted small">
                  Ingen aktive projekter endnu. Opret et nyt for at komme i gang.
                </p>
              ) : null}

              {archivedProjects.length ? (
                <>
                  <p className="project-section-label">Arkiverede projekter</p>
                  {archivedProjects.map((project) => (
                    <button
                      key={project.id}
                      type="button"
                      className={`project-list-item ${
                        selectedProjectSlug === project.slug ? "project-list-item-active" : ""
                      }`}
                      onClick={() => onSelectProject(project.slug)}
                    >
                      <span className="project-list-text">
                        <span className="project-list-name">{project.name}</span>
                      </span>
                    </button>
                  ))}
                </>
              ) : null}
              {projects.length > 0 && selectedProjectSlug && (
                <button
                  type="button"
                  className="ghost-button danger-button project-delete-button"
                  onClick={() => {
                    const project = projects.find((entry) => entry.slug === selectedProjectSlug);
                    if (project) {
                      onDeleteProject(project);
                    }
                  }}
                >
                  Slet projekt
                </button>
              )}
            </div>
          </div>
        </>
      ) : null}
    </aside>
  );
}

