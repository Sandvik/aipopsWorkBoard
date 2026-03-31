import type { ProjectRecord } from "../../types";
import { useState } from "react";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import sidebarImage from "../../assets/aipops-workboard-sidebar-transparent.png";
import { useLocale, useStrings } from "../../app/i18n";
import { getTextCatalog } from "../../app/i18n/catalog";

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
  onReorderProjects: (nextProjects: ProjectRecord[]) => void;
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
  onReorderProjects,
}: WorkspaceSidebarProps) {
  const { sidebar: t } = useStrings();
  const { locale } = useLocale();
  const local = getTextCatalog(locale).workspaceGhost;
  const [draggingProjectSlug, setDraggingProjectSlug] = useState("");

  function reorderSection(
    sourceSlug: string,
    targetSlug: string,
    sectionProjects: ProjectRecord[],
  ) {
    if (!sourceSlug || sourceSlug === targetSlug) return;
    const sourceIndex = sectionProjects.findIndex((project) => project.slug === sourceSlug);
    const targetIndex = sectionProjects.findIndex((project) => project.slug === targetSlug);
    if (sourceIndex < 0 || targetIndex < 0) return;

    const reorderedSection = [...sectionProjects];
    const [movedProject] = reorderedSection.splice(sourceIndex, 1);
    reorderedSection.splice(targetIndex, 0, movedProject);

    const sectionSlugs = new Set(sectionProjects.map((project) => project.slug));
    const nextProjects: ProjectRecord[] = [];
    let reorderedIndex = 0;
    for (const project of projects) {
      if (sectionSlugs.has(project.slug)) {
        nextProjects.push(reorderedSection[reorderedIndex]);
        reorderedIndex += 1;
      } else {
        nextProjects.push(project);
      }
    }
    onReorderProjects(nextProjects);
  }

  function renderProjectItem(project: ProjectRecord, sectionProjects: ProjectRecord[], archived = false) {
    return (
      <button
        key={project.id}
        type="button"
        draggable
        className={`project-list-item ${
          archived ? "project-list-item-archived-section" : "project-list-item-active-section"
        } ${selectedProjectSlug === project.slug ? "project-list-item-active" : ""} ${
          draggingProjectSlug === project.slug ? "project-list-item-dragging" : ""
        }`}
        title={projectTooltips[project.slug] || undefined}
        onClick={() => onSelectProject(project.slug)}
        onDragStart={(event) => {
          event.dataTransfer.effectAllowed = "move";
          event.dataTransfer.setData("text/plain", project.slug);
          setDraggingProjectSlug(project.slug);
        }}
        onDragEnd={() => setDraggingProjectSlug("")}
        onDragOver={(event) => {
          if (!draggingProjectSlug || draggingProjectSlug === project.slug) return;
          event.preventDefault();
        }}
        onDrop={(event) => {
          event.preventDefault();
          reorderSection(draggingProjectSlug, project.slug, sectionProjects);
          setDraggingProjectSlug("");
        }}
      >
        <span className="project-drag-handle" aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
        <span
          className={`project-list-strip ${
            archived ? "project-list-strip-archived" : "project-list-strip-active"
          }`}
          aria-hidden="true"
        />
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
    );
  }

  return (
    <aside className="left-rail">
      <div className="app-brand">
        <img
          className="app-brand-image"
          src={sidebarImage}
          alt={local.brandAlt}
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
                  {workspaceName || local.noFolderSelected}
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
              title={local.newProjectTitle}
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
              <p className="project-section-label">{local.activeProjects}</p>
              {activeProjects.map((project) => renderProjectItem(project, activeProjects))}
              {!activeProjects.length ? <p className="muted small">{t.noProjects}</p> : null}

              {archivedProjects.length ? (
                <>
                  <p className="project-section-label">{local.archivedProjects}</p>
                  {archivedProjects.map((project) => renderProjectItem(project, archivedProjects, true))}
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
              <p className="eyebrow">{t.yourWorkspace}</p>
              <div className="workspace-folder-chip">
                <span className="workspace-folder-strip" aria-hidden="true" />
                <p className="workspace-name">{local.sampleWorkspace}</p>
              </div>
            </div>
            <div className="workspace-card-actions">
              <div className="workspace-actions">
                <button type="button" className="primary-button" disabled>
                  {t.chooseWorkspace}
                </button>
                <button type="button" className="secondary-button" disabled>
                  {t.refreshButton}
                </button>
              </div>
            </div>
          </div>

          <div className="workspace-card projects-card">
            <div className="projects-head-main">
              <p className="eyebrow">{t.projectsHeader}</p>
            </div>
            <button type="button" className="primary-button new-project-button" disabled>
              {t.newProjectButton}
            </button>
            <button type="button" className="secondary-button morning-brief-button" disabled>
              {t.briefButton}
            </button>

            <div className="project-list">
              <p className="project-section-label">{local.activeProjects}</p>
              <div className="project-list-item project-list-item-skeleton">
                <span className="project-list-strip project-list-strip-active" aria-hidden="true" />
                <span className="project-list-text">
                  <span className="project-list-name">{local.sampleProjectA}</span>
                </span>
              </div>
              <div className="project-list-item project-list-item-skeleton">
                <span className="project-list-strip project-list-strip-active" aria-hidden="true" />
                <span className="project-list-text">
                  <span className="project-list-name">{local.sampleProjectB}</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
