export type TaskStatus = "backlog" | "todo" | "doing" | "done";
export type TaskPriority = "Low" | "Medium" | "High" | "Critical";

export interface AttachmentRecord {
  id: string;
  fileName: string;
  storedName: string;
  relativePath: string;
  size: number;
  uploadedAt: string;
}

export interface CommentRecord {
  id: string;
  text: string;
  createdAt: string;
}

export interface NoteRecord {
  id: string;
  title: string;
  body: string;
  color: "yellow" | "orange" | "green" | "blue" | "pink" | "gray";
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TaskRecord {
  id: string;
  title: string;
  slug: string;
  description: string;
  assignee: string;
  deadline: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  projectSlug: string;
  order: number;
  comments: CommentRecord[];
  attachments: AttachmentRecord[];
}

export interface ProjectRecord {
  id: string;
  name: string;
  slug: string;
  color: string;
  archived: boolean;
  createdAt: string;
}
