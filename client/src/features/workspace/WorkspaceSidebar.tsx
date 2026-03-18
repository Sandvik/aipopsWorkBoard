// Venstre sidebar med brand, arbejdsmappe-info og projektliste.
// Alle side-effekter (valg af mappe, reload, slet projekt) håndteres via callbacks.
import type { ProjectRecord } from "../../types";
// Billedet ligger i src/assets, så Vite kan fingerprint'e det korrekt.
// TypeScript kender ikke billed-typerne her som modul, så vi ignorerer typen lokalt.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import sidebarImage from "../../assets/aipops-workboard-sidebar-transparent.png";
import { useStrings } from "../../i18n";

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
  onShowNotes: () => void;
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
  onShowNotes,
  onPickWorkspace,
  onRefreshData,
  onCreateProject,
  onSelectProject,
  onDeleteProject,
}: WorkspaceSidebarProps) {
  const { sidebar: t } = useStrings();
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
              <p className="eyebrow">{t.yourWorkspace}</p>
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
                  title={workspaceName ? t.switchWorkspace : t.chooseWorkspace}
                >
                  {workspaceName ? t.switchFolderButton : t.chooseWorkspace}
                </button>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={onRefreshData}
                  disabled={busy}
                  title={t.refreshTooltip}
                >
                  {t.refreshButton}
                </button>
              </div>
            </div>
          </div>

          <div className="workspace-card projects-card">
            <div className="projects-head-main">
              <p className="eyebrow">{t.projectsHeader}</p>
            </div>
            <button
              type="button"
              className="primary-button new-project-button"
              disabled={busy || !hasWorkspace}
              onClick={onCreateProject}
              title="Opret et nyt projekt i den valgte arbejdsmappe"
            >
              {t.newProjectButton}
            </button>
            <button
              type="button"
              className="secondary-button morning-brief-button"
              onClick={onShowMorningBrief}
              disabled={busy}
              title={t.briefTooltip}
            >
              {t.briefButton}
            </button>
            <button
              type="button"
              className="secondary-button"
              onClick={onShowNotes}
              disabled={busy || !hasWorkspace}
              title={t.notesTooltip}
            >
              {t.notesButton}
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
                <p className="muted small">{t.noProjects}</p>
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
                  {t.deleteProjectButton}
                </button>
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="sidebar-ghost" aria-hidden="true">
          <div className="workspace-card">
            <div className="workspace-card-header">
              <p className="eyebrow">Din arbejdsmappe</p>
              <div className="workspace-folder-chip">
                <span className="workspace-folder-strip" aria-hidden="true" />
                <p className="workspace-name">Eksempel-mappe</p>
              </div>
            </div>
            <div className="workspace-card-actions">
              <div className="workspace-actions">
                <button type="button" className="primary-button" disabled>
                  Vælg mappe
                </button>
                <button type="button" className="secondary-button" disabled>
                  Opdater
                </button>
              </div>
            </div>
          </div>

          <div className="workspace-card projects-card">
            <div className="projects-head-main">
              <p className="eyebrow">Dine projekter</p>
            </div>
            <button type="button" className="primary-button new-project-button" disabled>
              + Nyt projekt
            </button>
            <button type="button" className="secondary-button morning-brief-button" disabled>
              ✨ Brief
            </button>

            <div className="project-list">
              <p className="project-section-label">Aktive projekter</p>
              <div className="project-list-item project-list-item-skeleton">
                <span className="project-list-strip project-list-strip-active" aria-hidden="true" />
                <span className="project-list-text">
                  <span className="project-list-name">Projekt A (eksempel)</span>
                </span>
              </div>
              <div className="project-list-item project-list-item-skeleton">
                <span className="project-list-strip project-list-strip-active" aria-hidden="true" />
                <span className="project-list-text">
                  <span className="project-list-name">Projekt B (eksempel)</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}

