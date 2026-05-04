export type UserStatus = "pending" | "active" | "rejected";

export type TaskStatus = 'todo' | 'in_progress' | 'done';

export type TaskPriority = "low" | "medium" | "high" | "critical";

export type ActivityType =
  | "project_created"
  | "task_created"
  | "task_updated"
  | "task_moved"
  | "comment_added"
  | "subtask_toggled"
  | "attachment_added"
  | "calendar_synced"
  | "role_changed"
  | "member_added";

export type CalendarSyncDirection = "task_to_google" | "google_to_task";

export type ProjectMemberRole = "admin" | "member";

export interface Profile {
  id: string;
  email: string;
  fullName: string;
  status: UserStatus;
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  code: string;
  description: string | null;
  createdBy: string;
  adminId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectMember {
  id: string;
  projectId: string;
  userId: string;
  role: ProjectMemberRole;
  joinedAt: string;
}

export interface BoardColumn {
  id: string;
  projectId: string;
  key: TaskStatus;
  name: string;
  position: number;
}

export interface Task {
  id: string;
  projectId: string;
  columnId: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId: string | null; // Deprecated: kept for Phase 2A compatibility
  dueDate: string | null;
  startDate: string | null;
  position: number;
  isMilestone: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  // Phase 2B: Multiple assignees
  assigneeIds?: string[];
  assigneeNames?: string[];
  // UI helpers (optional, set by API)
  isUnassigned?: boolean;
  canClaim?: boolean;
  assigneeName?: string;
}

export interface Subtask {
  id: string;
  taskId: string;
  title: string;
  isDone: boolean;
  position: number;
  createdAt: string;
  updatedAt: string;
}

export interface TaskComment {
  id: string;
  taskId: string;
  authorId: string;
  body: string;
  mentions: string[];
  createdAt: string;
}

export interface TaskAttachment {
  id: string;
  taskId: string;
  label: string;
  type: "file" | "link";
  storagePath: string | null;
  url: string | null;
  uploadedBy: string;
  createdAt: string;
}

export interface ActivityEvent {
  id: string;
  projectId: string | null;
  taskId: string | null;
  actorId: string;
  activityType: ActivityType;
  message: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface CalendarConnection {
  id: string;
  provider: "google";
  calendarId: string;
  userId: string | null; // null = shared calendar; non-null = user preference (for future)
  accessToken: string;
  refreshToken: string;
  tokenExpiresAt: string | null;
  syncToken: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CalendarLink {
  id: string;
  taskId: string;
  calendarConnectionId: string;
  externalEventId: string;
  lastSyncDirection: CalendarSyncDirection;
  lastSyncedAt: string;
}

export interface TaskWithDetails extends Task {
  subtasks: Subtask[];
  comments: TaskComment[];
  attachments: TaskAttachment[];
}

export interface ProjectProgressStats {
  projectId: string;
  projectName: string;
  totalTasks: number;
  doneTasks: number;
  completionRate: number;
  overdueTasks: number;
  milestoneBurndown: Array<{ date: string; remainingMilestones: number }>;
  statusDistribution: Array<{ status: TaskStatus; count: number }>;
  completionTrend: Array<{ period: string; completedCount: number }>;
}
