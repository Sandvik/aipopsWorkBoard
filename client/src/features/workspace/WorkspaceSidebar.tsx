// Venstre sidebar med brand, arbejdsmappe-info og projektliste.
// Alle side-effekter (valg af mappe, reload, slet projekt) håndteres via callbacks.
import type { ProjectRecord } from "../../types";
// Billedet ligger i src/assets, så Vite kan fingerprint'e det korrekt.
// TypeScript kender ikke billed-typerne her som modul, så vi ignorerer typen lokalt.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import sidebarImage from "../../assets/aipops-workboard-sidebar-transparent.png";

type WorkspaceSidebarProps = {
  hasWorkspace: boolean;
  workspaceName: string;
  busy: boolean;
  projects: ProjectRecord[];
  activeProjects: ProjectRecord[];
  archivedProjects: ProjectRecord[];
  selectedProjectSlug: string;
  workspaceProgressLabel: string;
  workspaceProgressTooltip: string;
  projectTooltips: Record<string, string>;
  projectTaskCounts: Record<string, number>;
  onShowMorningBrief: () => void;
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
  workspaceProgressLabel,
  workspaceProgressTooltip,
  projectTooltips,
  projectTaskCounts,
  onShowMorningBrief,
  onPickWorkspace,
  onRefreshData,
  onCreateProject,
  onSelectProject,
  onDeleteProject,
}: WorkspaceSidebarProps) {
  return (
    <aside className="left-rail">
      <div className="app-brand">
        <img
          className="app-brand-image"
          src={sidebarImage}
          alt="AIPOPS Workboard – ét roligt board til opgaver og projekter"
        />
      </div>
      {hasWorkspace ? (
        <>
          <div className="workspace-card">
            <div className="workspace-card-header">
              <p className="eyebrow">Din arbejdsmappe</p>
              <div className="workspace-folder-chip" title={workspaceName || undefined}>
                <span className="workspace-folder-strip" aria-hidden="true" />
                <p className="workspace-name">
                  {workspaceName || "Ingen mappe valgt"}
                </p>
              </div>         
             
            </div>
            <div className="workspace-card-actions">
              <div className="workspace-actions">
                <button
                  type="button"
                  className="primary-button"
                  onClick={onPickWorkspace}
                  disabled={busy}
                  title={
                    workspaceName
                      ? "Skift til en anden arbejdsmappe"
                      : "Vælg en arbejdsmappe for at komme i gang"
                  }
                >
                  {workspaceName ? "Skift mappe" : "Vælg mappe"}
                </button>
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
            </div>
          </div>

          <div className="workspace-card projects-card">
            <div className="projects-head-main">
              <p className="eyebrow">Dine projekter</p>
            </div>
            <button
              type="button"
              className="primary-button new-project-button"
              disabled={busy || !hasWorkspace}
              onClick={onCreateProject}
              title="Opret et nyt projekt i den valgte arbejdsmappe"
            >
              + Nyt projekt
            </button>
            <button
              type="button"
              className="secondary-button morning-brief-button"
              onClick={onShowMorningBrief}
              disabled={busy}
              title="Få et kort overblik over dine projekter og opgaver i dag"
            >
              ✨ Brief
            </button>

            <div className="project-list">
              <p className="project-section-label">Aktive projekter</p>
              {activeProjects.map((project) => (
                <button
                  key={project.id}
                  type="button"
                  className={`project-list-item project-list-item-active-section ${
                    selectedProjectSlug === project.slug ? "project-list-item-active" : ""
                  }`}
                  title={projectTooltips[project.slug] || undefined}
                  onClick={() => onSelectProject(project.slug)}
                >
                  <span className="project-list-strip project-list-strip-active" aria-hidden="true" />
                  <span className="project-list-text">
                    <span className="project-list-name">
                      {project.name}
                      {typeof projectTaskCounts[project.slug] === "number" ? (
                        <span className="project-task-count-badge">
                          {projectTaskCounts[project.slug]}
                        </span>
                      ) : null}
                    </span>
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
                      className={`project-list-item project-list-item-archived-section ${
                        selectedProjectSlug === project.slug ? "project-list-item-active" : ""
                      }`}
                      title={projectTooltips[project.slug] || undefined}
                      onClick={() => onSelectProject(project.slug)}
                    >
                      <span className="project-list-strip project-list-strip-archived" aria-hidden="true" />
                      <span className="project-list-text">
                      <span className="project-list-name">
                        {project.name}
                        {typeof projectTaskCounts[project.slug] === "number" ? (
                          <span className="project-task-count-badge">
                            {projectTaskCounts[project.slug]}
                          </span>
                        ) : null}
                      </span>
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

