import { z } from "zod";

export const projectCreateSchema = z.object({
  name: z.string().trim().min(2).max(100),
  code: z.string().trim().min(2).max(24).regex(/^[A-Z0-9-_]+$/i),
  description: z.string().trim().max(500).nullable().optional()
});

export const projectUpdateSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  description: z.string().trim().max(500).nullable().optional()
});

export const taskCreateSchema = z.object({
  projectId: z.string().uuid(),
  columnId: z.string().uuid(),
  title: z.string().trim().min(2).max(180),
  description: z.string().trim().max(5000).nullable().optional(),
  status: z.enum(["todo", "in_progress", "done"]),
  priority: z.enum(["low", "medium", "high", "critical"]),
  assigneeId: z.string().uuid().nullable().optional(),
  dueDate: z.string().datetime().nullable().optional(),
  startDate: z.string().datetime().nullable().optional(),
  labels: z.array(z.string()).optional(),
  isMilestone: z.boolean().optional()
});

export const taskUpdateSchema = taskCreateSchema
  .omit({ projectId: true, columnId: true })
  .partial()
  .extend({
    columnId: z.string().uuid().optional(),
    position: z.number().int().min(0).optional()
  });

export const taskMoveSchema = z.object({
  taskId: z.string().uuid(),
  toColumnId: z.string().uuid(),
  toStatus: z.enum(["todo", "in_progress", "done"]),
  toIndex: z.number().int().min(0)
});

export const commentCreateSchema = z.object({
  body: z.string().trim().min(1).max(2000)
});

export const attachmentCreateSchema = z.object({
  label: z.string().trim().min(1).max(160),
  type: z.enum(["file", "link"]),
  url: z.string().url().optional(),
  storagePath: z.string().optional()
});
