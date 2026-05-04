import { createClient } from "@/lib/supabase/server";
import { computeProjectProgress } from "@/lib/analytics";
import { reorderTasks } from "@/lib/task-ordering";
import type {
  ActivityEvent,
  ActivityType,
  BoardColumn,
  Project,
  ProjectProgressStats,
  Subtask,
  Task,
  TaskAttachment,
  TaskComment
} from "@/types/domain";


type ProjectRow = {
  id: string;
  name: string;
  code: string;
  description: string | null;
  created_by: string;
  admin_id: string; // 👈 ADD THIS LINE
  created_at: string;
  updated_at: string;
};

type ColumnRow = {
  id: string;
  project_id: string;
  key: Task["status"];
  name: string;
  position: number;
};

type TaskRow = {
  id: string;
  project_id: string;
  column_id: string;
  title: string;
  description: string | null;
  status: Task["status"];
  priority: Task["priority"];
  assignee_id: string | null;
  due_date: string | null;
  start_date: string | null;
  position: number;
  is_milestone: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
};

type SubtaskRow = {
  id: string;
  task_id: string;
  title: string;
  is_done: boolean;
  position: number;
  created_at: string;
  updated_at: string;
};

type CommentRow = {
  id: string;
  task_id: string;
  author_id: string;
  body: string;
  mentions: string[] | null;
  created_at: string;
};

type AttachmentRow = {
  id: string;
  task_id: string;
  uploaded_by: string;
  label: string;
  type: "file" | "link";
  storage_path: string | null;
  url: string | null;
  created_at: string;
};

type ActivityRow = {
  id: string;
  project_id: string | null;
  task_id: string | null;
  actor_id: string;
  activity_type: ActivityType;
  message: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

function mapProject(row: ProjectRow): Project {
  return {
    id: row.id,
    name: row.name,
    code: row.code,
    description: row.description,
    createdBy: row.created_by,
    adminId: row.admin_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function mapColumn(row: ColumnRow): BoardColumn {
  return {
    id: row.id,
    projectId: row.project_id,
    key: row.key,
    name: row.name,
    position: row.position
  };
}

function mapTask(row: TaskRow): Task {
  return {
    id: row.id,
    projectId: row.project_id,
    columnId: row.column_id,
    title: row.title,
    description: row.description,
    status: row.status,
    priority: row.priority,
    assigneeId: row.assignee_id,
    dueDate: row.due_date,
    startDate: row.start_date,
    position: row.position,
    isMilestone: row.is_milestone,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function mapSubtask(row: SubtaskRow): Subtask {
  return {
    id: row.id,
    taskId: row.task_id,
    title: row.title,
    isDone: row.is_done,
    position: row.position,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function mapComment(row: CommentRow): TaskComment {
  return {
    id: row.id,
    taskId: row.task_id,
    authorId: row.author_id,
    body: row.body,
    mentions: row.mentions ?? [],
    createdAt: row.created_at
  };
}

function mapAttachment(row: AttachmentRow): TaskAttachment {
  return {
    id: row.id,
    taskId: row.task_id,
    label: row.label,
    type: row.type,
    storagePath: row.storage_path,
    url: row.url,
    uploadedBy: row.uploaded_by,
    createdAt: row.created_at
  };
}

function mapActivity(row: ActivityRow): ActivityEvent {
  return {
    id: row.id,
    projectId: row.project_id,
    taskId: row.task_id,
    actorId: row.actor_id,
    activityType: row.activity_type,
    message: row.message,
    metadata: row.metadata ?? {},
    createdAt: row.created_at
  };
}

export async function listProjects() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .order("updated_at", { ascending: false })
    .returns<ProjectRow[]>();
  return { data: data?.map(mapProject) ?? null, error };
}

export async function createProject(input: {
  name: string;
  code: string;
  description?: string | null;
  createdBy: string;
}) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .insert({
      name: input.name,
      code: input.code.toUpperCase(),
      description: input.description ?? null,
      created_by: input.createdBy
    })
    .select("*")
    .single<ProjectRow>();

  if (error || !data) {
    return { data: null, error };
  }

  await supabase.from("project_members").insert({
    project_id: data.id,
    user_id: input.createdBy
  });

  const defaultColumns = [
    { key: "todo", name: "To Do", position: 0 },
    { key: "in_progress", name: "In Progress", position: 1000 },
    { key: "done", name: "Done", position: 2000 }
];

  await supabase.from("board_columns").insert(
    defaultColumns.map((column) => ({
      ...column,
      project_id: data.id
    }))
  );

  return { data: mapProject(data), error: null };
}

export async function updateProject(
  projectId: string,
  updates: { name?: string; description?: string | null }
) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .update({
      ...(updates.name ? { name: updates.name } : {}),
      ...(Object.prototype.hasOwnProperty.call(updates, "description")
        ? { description: updates.description ?? null }
        : {}),
      updated_at: new Date().toISOString()
    })
    .eq("id", projectId)
    .select("*")
    .single<ProjectRow>();

  return { data: data ? mapProject(data) : null, error };
}

export async function getProjectBoard(projectId: string) {
  const supabase = await createClient();
  const [projectResult, columnsResult, tasksResult] = await Promise.all([
    supabase.from("projects").select("*").eq("id", projectId).single<ProjectRow>(),
    supabase
      .from("board_columns")
      .select("*")
      .eq("project_id", projectId)
      .order("position", { ascending: true })
      .returns<ColumnRow[]>(),
    supabase
      .from("tasks")
      .select("*")
      .eq("project_id", projectId)
      .order("position", { ascending: true })
      .returns<TaskRow[]>()
  ]);

  // Phase 2B: Fetch task assignments
  const taskIds = tasksResult.data?.map((t) => t.id) ?? [];
  const assignmentsResult = taskIds.length > 0
    ? await supabase
        .from("task_assignments")
        .select("task_id, user_id, profiles:user_id(full_name, email)")
        .in("task_id", taskIds)
    : { data: [] };

  // Phase 2B: Map assignments to tasks
  const assignmentsByTask = new Map<string, Array<{ userId: string; userName: string }>>();
  assignmentsResult.data?.forEach((a: any) => {
    const taskId = a.task_id;
    if (!assignmentsByTask.has(taskId)) {
      assignmentsByTask.set(taskId, []);
    }
    assignmentsByTask.get(taskId)!.push({
      userId: a.user_id,
      userName: a.profiles?.full_name || a.profiles?.email || "Unknown"
    });
  });

  const tasks = tasksResult.data?.map((task) => ({
    ...mapTask(task),
    assigneeIds: assignmentsByTask.get(task.id)?.map((a) => a.userId),
    assigneeNames: assignmentsByTask.get(task.id)?.map((a) => a.userName)
  })) ?? [];

  return {
    data: {
      project: projectResult.data ? mapProject(projectResult.data) : null,
      columns: columnsResult.data?.map(mapColumn) ?? [],
      tasks
    },
    error: projectResult.error ?? columnsResult.error ?? tasksResult.error ?? ("error" in assignmentsResult ? assignmentsResult.error : null)
  };
}

export async function listTasks(projectId?: string) {
  const supabase = await createClient();
  const query = supabase.from("tasks").select("*").order("updated_at", { ascending: false });
  if (projectId) {
    query.eq("project_id", projectId);
  }
  const { data, error } = await query.returns<TaskRow[]>();
  return { data: data?.map(mapTask) ?? null, error };
}

export async function createTask(input: {
  projectId: string;
  columnId: string;
  title: string;
  description?: string | null;
  status: Task["status"];
  priority: Task["priority"];
  assigneeId?: string | null;
  dueDate?: string | null;
  startDate?: string | null;
  isMilestone?: boolean;
  createdBy: string;
}) {
  const supabase = await createClient();
  const { data: highestPositionTask } = await supabase
    .from("tasks")
    .select("position")
    .eq("column_id", input.columnId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle<{ position: number }>();

  const { data, error } = await supabase
    .from("tasks")
    .insert({
      project_id: input.projectId,
      column_id: input.columnId,
      title: input.title,
      description: input.description ?? null,
      status: input.status,
      priority: input.priority,
      assignee_id: input.assigneeId ?? null,
      due_date: input.dueDate ?? null,
      start_date: input.startDate ?? null,
      is_milestone: input.isMilestone ?? false,
      created_by: input.createdBy,
      position: (highestPositionTask?.position ?? 0) + 1000
    })
    .select("*")
    .single<TaskRow>();

  return { data: data ? mapTask(data) : null, error };
}

function toTaskUpdatePayload(updates: Partial<Task>) {
  const payload: Record<string, unknown> = {
    updated_at: new Date().toISOString()
  };

  if (typeof updates.title === "string") payload.title = updates.title;
  if (Object.prototype.hasOwnProperty.call(updates, "description")) payload.description = updates.description;
  if (updates.status) payload.status = updates.status;
  if (updates.priority) payload.priority = updates.priority;
  if (Object.prototype.hasOwnProperty.call(updates, "assigneeId")) payload.assignee_id = updates.assigneeId;
  if (Object.prototype.hasOwnProperty.call(updates, "dueDate")) payload.due_date = updates.dueDate;
  if (Object.prototype.hasOwnProperty.call(updates, "startDate")) payload.start_date = updates.startDate;
  if (Object.prototype.hasOwnProperty.call(updates, "columnId")) payload.column_id = updates.columnId;
  if (Object.prototype.hasOwnProperty.call(updates, "position")) payload.position = updates.position;
  if (Object.prototype.hasOwnProperty.call(updates, "isMilestone"))
    payload.is_milestone = updates.isMilestone;

  return payload;
}

export async function updateTask(taskId: string, updates: Partial<Task>) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tasks")
    .update(toTaskUpdatePayload(updates))
    .eq("id", taskId)
    .select("*")
    .single<TaskRow>();

  return { data: data ? mapTask(data) : null, error };
}

export async function moveTask(input: {
  taskId: string;
  toColumnId: string;
  toStatus: Task["status"];
  toIndex: number;
}) {
  const supabase = await createClient();
  const { data: movingRow, error: movingTaskError } = await supabase
    .from("tasks")
    .select("*")
    .eq("id", input.taskId)
    .single<TaskRow>();

  if (movingTaskError || !movingRow) {
    return { data: null, error: movingTaskError };
  }

  const { data: destinationRows, error: destinationError } = await supabase
    .from("tasks")
    .select("*")
    .eq("column_id", input.toColumnId)
    .neq("id", input.taskId)
    .order("position", { ascending: true })
    .returns<TaskRow[]>();

  if (destinationError) {
    return { data: null, error: destinationError };
  }

  const movingTask = mapTask(movingRow);
  const reordered = reorderTasks(
    [...(destinationRows ?? []).map(mapTask), { ...movingTask, columnId: input.toColumnId, status: input.toStatus }],
    input.taskId,
    input.toIndex
  );

  await Promise.all(
    reordered.map((task) =>
      supabase
        .from("tasks")
        .update({
          position: task.position,
          column_id: task.id === input.taskId ? input.toColumnId : task.columnId,
          status: task.id === input.taskId ? input.toStatus : task.status,
          updated_at: new Date().toISOString()
        })
        .eq("id", task.id)
    )
  );

  const { data, error } = await supabase.from("tasks").select("*").eq("id", input.taskId).single<TaskRow>();
  return { data: data ? mapTask(data) : null, error };
}

export async function addComment(taskId: string, authorId: string, body: string, mentions: string[]) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("task_comments")
    .insert({
      task_id: taskId,
      author_id: authorId,
      body,
      mentions
    })
    .select("*")
    .single<CommentRow>();

  return { data: data ? mapComment(data) : null, error };
}

export async function addAttachment(
  taskId: string,
  uploadedBy: string,
  input: { label: string; type: "file" | "link"; storagePath?: string; url?: string }
) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("task_attachments")
    .insert({
      task_id: taskId,
      uploaded_by: uploadedBy,
      label: input.label,
      type: input.type,
      storage_path: input.storagePath ?? null,
      url: input.url ?? null
    })
    .select("*")
    .single<AttachmentRow>();

  return { data: data ? mapAttachment(data) : null, error };
}

export async function listTaskDetails(taskId: string) {
  const supabase = await createClient();
  const [taskResult, subtasksResult, commentsResult, attachmentsResult] = await Promise.all([
    supabase.from("tasks").select("*").eq("id", taskId).single<TaskRow>(),
    supabase
      .from("subtasks")
      .select("*")
      .eq("task_id", taskId)
      .order("position", { ascending: true })
      .returns<SubtaskRow[]>(),
    supabase
      .from("task_comments")
      .select("*")
      .eq("task_id", taskId)
      .order("created_at", { ascending: true })
      .returns<CommentRow[]>(),
    supabase
      .from("task_attachments")
      .select("*")
      .eq("task_id", taskId)
      .order("created_at", { ascending: false })
      .returns<AttachmentRow[]>()
  ]);

  return {
    data: {
      task: taskResult.data ? mapTask(taskResult.data) : null,
      subtasks: subtasksResult.data?.map(mapSubtask) ?? [],
      comments: commentsResult.data?.map(mapComment) ?? [],
      attachments: attachmentsResult.data?.map(mapAttachment) ?? []
    },
    error: taskResult.error ?? subtasksResult.error ?? commentsResult.error ?? attachmentsResult.error
  };
}

export async function createSubtask(taskId: string, title: string) {
  const supabase = await createClient();
  const { data: lastSubtask } = await supabase
    .from("subtasks")
    .select("position")
    .eq("task_id", taskId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle<{ position: number }>();

  const { data, error } = await supabase
    .from("subtasks")
    .insert({
      task_id: taskId,
      title,
      position: (lastSubtask?.position ?? 0) + 1000
    })
    .select("*")
    .single<SubtaskRow>();

  return { data: data ? mapSubtask(data) : null, error };
}

export async function toggleSubtask(taskId: string, subtaskId: string, isDone: boolean) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("subtasks")
    .update({
      is_done: isDone,
      updated_at: new Date().toISOString()
    })
    .eq("task_id", taskId)
    .eq("id", subtaskId)
    .select("*")
    .single<SubtaskRow>();

  return { data: data ? mapSubtask(data) : null, error };
}

export async function logActivity(input: {
  actorId: string;
  activityType: ActivityType;
  message: string;
  projectId?: string | null;
  taskId?: string | null;
  metadata?: Record<string, unknown>;
}) {
  const supabase = await createClient();
  return supabase.from("activity_events").insert({
    actor_id: input.actorId,
    activity_type: input.activityType,
    message: input.message,
    project_id: input.projectId ?? null,
    task_id: input.taskId ?? null,
    metadata: input.metadata ?? {}
  });
}

export async function listActivity(projectId?: string) {
  const supabase = await createClient();
  const query = supabase
    .from("activity_events")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(80);
  if (projectId) {
    query.eq("project_id", projectId);
  }
  const { data, error } = await query.returns<ActivityRow[]>();
  return { data: data?.map(mapActivity) ?? null, error };
}

export async function computeAllProjectProgress(): Promise<ProjectProgressStats[]> {
  const supabase = await createClient();
  const [projectsResult, tasksResult] = await Promise.all([
    supabase.from("projects").select("id, name").returns<Array<{ id: string; name: string }>>(),
    supabase.from("tasks").select("*").returns<TaskRow[]>()
  ]);

  if (projectsResult.error) {
    throw projectsResult.error;
  }
  if (tasksResult.error) {
    throw tasksResult.error;
  }

  const tasks = (tasksResult.data ?? []).map(mapTask);
  return (projectsResult.data ?? []).map((project) =>
    computeProjectProgress(
      project.id,
      project.name,
      tasks.filter((task) => task.projectId === project.id)
    )
  );
}
export async function deleteProject(projectId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("projects").delete().eq("id", projectId);
  if (error) throw error;
}

export async function deleteTask(taskId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("tasks").delete().eq("id", taskId);
  if (error) throw error;
}

export async function assignUserToTask(taskId: string, userId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("task_assignments").insert({
    task_id: taskId,
    user_id: userId
  });
  if (error) throw error;
}
