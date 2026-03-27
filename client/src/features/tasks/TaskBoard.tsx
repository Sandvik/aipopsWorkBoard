// Præsentationskomponent for opgave-boardet (de fire kolonner).
// Drag-håndtag og "åbn detaljer"-område er bevidst adskilt,
// så en drag-interaktion aldrig skal kæmpe mod et klik på samme element.
import type { KeyboardEvent } from "react";
import type { ProjectRecord, TaskRecord, TaskStatus } from "../../types";
import { PRIORITY_LABELS, formatDate, isOverdue } from "./taskUi";
import { useStrings } from "../../i18n";

type TaskBoardProps = {
  tasks: TaskRecord[];
  projects: ProjectRecord[];
  selectedTaskId: string;
  dragTaskId: string;
  dragOverStatus: TaskStatus | "";
  onTaskSelect: (taskId: string) => void;
  onTaskDrop: (taskId: string, nextStatus: TaskStatus, orderedTaskIds: string[]) => void;
  onTaskDragStart: (taskId: string) => void;
  onTaskDragEnterColumn: (status: TaskStatus) => void;
  onTaskDragEnd: () => void;
};

export function TaskBoard({
  tasks,
  projects,
  selectedTaskId,
  dragTaskId,
  dragOverStatus,
  onTaskSelect,
  onTaskDrop,
  onTaskDragStart,
  onTaskDragEnterColumn,
  onTaskDragEnd,
}: TaskBoardProps) {
  const { board } = useStrings();

  function handleCardKeyDown(event: KeyboardEvent<HTMLDivElement>, taskId: string) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      event.stopPropagation();
      onTaskSelect(taskId);
    }
  }

  return (
    <>
      {(["backlog", "todo", "doing", "done"] as TaskStatus[]).map((status) => {
        const columnTasks = tasks.filter((task) => task.status === status);

        return (
          <div
            key={status}
            className={`board-column ${dragOverStatus === status ? "board-column-drop-target" : ""}`}
            onDragOver={(event) => {
              event.preventDefault();
              if (dragTaskId) {
                onTaskDragEnterColumn(status);
              }
            }}
            onDrop={(event) => {
              event.preventDefault();
              const taskId = event.dataTransfer.getData("text/plain");
              if (!taskId) {
                onTaskDragEnd();
                return;
              }

              const orderedTaskIds = [
                ...columnTasks
                  .filter((task) => task.id !== taskId)
                  .map((task) => task.id),
                taskId,
              ];

              onTaskDrop(taskId, status, orderedTaskIds);
              onTaskDragEnd();
            }}
          >
            <div className="column-header">
              <div>
                <h2>{board.columnTitles[status]}</h2>
                <p className="column-subtitle muted small">{board.columnSubtitles[status]}</p>
              </div>
              <span className="muted column-count">{columnTasks.length}</span>
            </div>

            <div className="column-body">
              {columnTasks.map((task) => {
                const project = projects.find((entry) => entry.slug === task.projectSlug);

                return (
                  <div
                    key={task.id}
                    className={`task-card task-card-priority-${task.priority.toLowerCase()} ${
                      selectedTaskId === task.id ? "active" : ""
                    } ${dragTaskId === task.id ? "dragging" : ""}`}
                  >
                    <div className="row between tight task-card-top">
                      <span
                        className="task-drag-handle"
                        draggable
                        role="button"
                        aria-label={`Flyt opgaven ${task.title}`}
                        onMouseDown={(event) => {
                          event.stopPropagation();
                        }}
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                        }}
                        onDragStart={(event) => {
                          event.stopPropagation();
                          event.dataTransfer.effectAllowed = "move";
                          event.dataTransfer.setData("text/plain", task.id);
                          onTaskDragStart(task.id);
                        }}
                        onDragEnd={() => {
                          onTaskDragEnd();
                        }}
                      >
                        ☰
                      </span>

                      <div
                        className="task-card-select-region"
                        role="button"
                        tabIndex={0}
                        onClick={(event) => {
                          event.stopPropagation();
                          onTaskSelect(task.id);
                        }}
                        onKeyDown={(event) => handleCardKeyDown(event, task.id)}
                      >
                        <div className="task-card-title-row">
                          <strong className="task-title">{task.title}</strong>
                          <span className={`priority-pill priority-${task.priority.toLowerCase()}`}>
                            {PRIORITY_LABELS[task.priority]}
                          </span>
                        </div>
                        <div className="project-mark">{project?.name ?? task.projectSlug}</div>
                        <div className="task-card-meta">
                          <span className="muted">👤 {task.assignee || board.assigneeNone}</span>
                          <span className={`deadline ${isOverdue(task.deadline) ? "overdue" : ""}`}>
                            🗓 {formatDate(task.deadline)}
                          </span>
                          {task.attachments.length > 0 ? (
                            <span className="task-chip">📎 {task.attachments.length}</span>
                          ) : null}
                          {task.comments.length > 0 ? (
                            <span className="task-chip">💬 {task.comments.length}</span>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {dragOverStatus === status && dragTaskId ? (
                <div className="drop-indicator">{board.dropHint ?? "Slip opgaven her"}</div>
              ) : null}

              {!columnTasks.length ? <div className="muted">{board.emptyColumn}</div> : null}
            </div>
          </div>
        );
      })}
    </>
  );
}
