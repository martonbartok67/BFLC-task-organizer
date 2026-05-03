-- Phase 2B: Joint Tasks - Multiple Assignees
-- Supports assigning multiple team members to a single task

-- Create task_assignments table
CREATE TABLE public.task_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  assigned_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  UNIQUE(task_id, user_id)
);

-- Indexes for fast lookups
CREATE INDEX task_assignments_task_id_idx ON public.task_assignments(task_id);
CREATE INDEX task_assignments_user_id_idx ON public.task_assignments(user_id);

-- RLS: Users can see assignments for tasks in their projects
-- (policy to be added when building API endpoints)
ALTER TABLE public.task_assignments ENABLE ROW LEVEL SECURITY;

-- Backfill: Migrate existing assignee_id to task_assignments
INSERT INTO public.task_assignments (task_id, user_id, assigned_at)
SELECT id, assignee_id, updated_at
FROM public.tasks
WHERE assignee_id IS NOT NULL;

-- Future: Can drop assignee_id column after testing, but keeping for now for compatibility
-- ALTER TABLE public.tasks DROP COLUMN assignee_id;
