-- Phase 3: Global Admin Roles + Project Assignments
-- Move from project-scoped admin/member to organization-wide admin roles

-- Step 1: Add is_admin flag to profiles (global admin status)
ALTER TABLE public.profiles
ADD COLUMN is_admin BOOLEAN NOT NULL DEFAULT FALSE;

-- Step 2: Create project_assignments table (replaces per-project roles)
-- Users assigned to projects (no roles here, roles are global)
CREATE TABLE public.project_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(project_id, user_id)
);

-- Indexes
CREATE INDEX project_assignments_project_id_idx ON public.project_assignments(project_id);
CREATE INDEX project_assignments_user_id_idx ON public.project_assignments(user_id);

-- RLS
ALTER TABLE public.project_assignments ENABLE ROW LEVEL SECURITY;

-- Step 3: Migrate data from project_members
-- All current project_members become project_assignments
-- Admins from project_members become global admins
INSERT INTO public.profiles (is_admin)
SELECT DISTINCT pm.user_id
FROM public.project_members pm
WHERE pm.role = 'admin'
ON CONFLICT DO NOTHING;

UPDATE public.profiles
SET is_admin = TRUE
WHERE id IN (
  SELECT DISTINCT pm.user_id
  FROM public.project_members pm
  WHERE pm.role = 'admin'
);

-- Migrate all project memberships to assignments
INSERT INTO public.project_assignments (project_id, user_id)
SELECT DISTINCT project_id, user_id
FROM public.project_members
ON CONFLICT DO NOTHING;

-- Step 4: Remove old project_members table (after verified safe)
-- DROP TABLE public.project_members;

-- Step 5: Remove admin_id from projects (no longer needed)
ALTER TABLE public.projects
DROP COLUMN IF EXISTS admin_id;
