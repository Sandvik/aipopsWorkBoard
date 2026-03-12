// Præsentationskomponent for opgave-boardet (de fire kolonner).
// Har intet kendskab til filsystem eller global app-state –
// alt styres via props og callbacks.
import type { ProjectRecord, TaskRecord, TaskStatus } from "../../types";
import { PRIORITY_LABELS, STATUS_LABELS, formatDate, isOverdue } from "./taskUi";

type TaskBoardProps = {
  // Alle tasks der skal vises (allerede filtreret i App).
  tasks: TaskRecord[];
  // Liste over projekter, så vi kan vise projektnavn på kortene.
  projects: ProjectRecord[];
  // Id på den aktuelt valgte opgave, så kortet kan markeres.
  selectedTaskId: string;
  // Id på den task, der aktuelt trækkes med drag & drop.
  dragTaskId: string;
  // Brugeren har klikket på et kort.
  onTaskSelect: (taskId: string) => void;
  // Brugeren har sluppet et kort i en kolonne med en given status.
  onTaskDrop: (taskId: string, nextStatus: TaskStatus) => void;
  // Drag & drop starter for en given task.
  onTaskDragStart: (taskId: string) => void;
  // Drag & drop afsluttes (uanset om noget blev droppet).
  onTaskDragEnd: () => void;
};

export function TaskBoard({
  tasks,
  projects,
  selectedTaskId,
  dragTaskId,
  onTaskSelect,
  onTaskDrop,
  onTaskDragStart,
  onTaskDragEnd,
}: TaskBoardProps) {
  return (
    <>
      {(["backlog", "todo", "doing", "done"] as TaskStatus[]).map((status) => {
        // Tasks i den enkelte kolonne (status).
        const columnTasks = tasks.filter((task) => task.status === status);
        return (
          <div
            key={status}
            className="board-column"
            onDragOver={(event) => {
              // Tillad drop ved at forhindre default.
              event.preventDefault();
            }}
            onDrop={(event) => {
              event.preventDefault();
              const taskId = event.dataTransfer.getData("text/plain");
              if (taskId) {
                onTaskDrop(taskId, status);
              }
              onTaskDragEnd();
            }}
          >
            <div className="column-header">
              <h2>{STATUS_LABELS[status]}</h2>
              <span className="muted">{columnTasks.length}</span>
            </div>
            <div className="column-body">
              {columnTasks.map((task) => {
                const project = projects.find((entry) => entry.slug === task.projectSlug);
                return (
                  <button
                    key={task.id}
                    type="button"
                    className={`task-card task-card-priority-${task.priority.toLowerCase()} ${
                      selectedTaskId === task.id ? "active" : ""
                    } ${dragTaskId === task.id ? "dragging" : ""}`}
                    onClick={(event) => {
                      // Undgå at klikket bobler op og f.eks. rydder selection.
                      event.stopPropagation();
                      onTaskSelect(task.id);
                    }}
                  >
                    <div className="row between tight task-card-top">
                      <span
                        className="task-drag-handle"
                        draggable
                        onMouseDown={(event) => {
                          // Undgå at mousedown vælger kortet utilsigtet.
                          event.stopPropagation();
                        }}
                        onDragStart={(event) => {
                          // Sender task-id med som plain text i dataTransfer,
                          // så kolonne-containeren kan læse det i onDrop.
                          event.stopPropagation();
                          event.dataTransfer.setData("text/plain", task.id);
                          onTaskDragStart(task.id);
                        }}
                      >
                        ☰
                      </span>
                      <strong className="task-title">{task.title}</strong>
                      <span className={`priority-pill priority-${task.priority.toLowerCase()}`}>
                        {PRIORITY_LABELS[task.priority]}
                      </span>
                    </div>
                    <div className="project-mark">{project?.name ?? task.projectSlug}</div>
                    <div className="task-card-meta">
                      <span className="muted">👤 {task.assignee || "Ingen ansvarlig"}</span>
                      <span className={`deadline ${isOverdue(task.deadline) ? "overdue" : ""}`}>
                        🗓 {formatDate(task.deadline)}
                      </span>
                      {task.attachments.length > 0 && (
                        <span className="task-chip">📎 {task.attachments.length}</span>
                      )}
                      {task.comments.length > 0 && <span className="task-chip">💬 {task.comments.length}</span>}
                    </div>
                  </button>
                );
              })}
              {!columnTasks.length ? <div className="muted">Ingen opgaver i denne kolonne.</div> : null}
            </div>
          </div>
        );
      })}
    </>
  );
}

