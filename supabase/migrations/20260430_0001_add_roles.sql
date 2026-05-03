-- Phase 2A: Task Assignment + Admin/Member Roles
-- This migration:
-- 1. Adds admin_id to projects (first admin who created project)
-- 2. Creates project_members table (tracks role per project)
-- 3. Sets up initial data from existing projects

-- Step 1: Add admin_id to projects table
ALTER TABLE public.projects 
ADD COLUMN admin_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Step 2: Create project_members table
CREATE TABLE public.project_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'member')) DEFAULT 'member',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(project_id, user_id)
);

-- Step 3: Create indexes for performance
CREATE INDEX idx_project_members_project ON public.project_members(project_id);
CREATE INDEX idx_project_members_user ON public.project_members(user_id);
CREATE INDEX idx_project_members_role ON public.project_members(role);

-- Step 4: Migrate existing projects - set admin_id to creator
UPDATE public.projects 
SET admin_id = created_by
WHERE admin_id IS NULL;

-- Step 5: Create initial project_members entries
-- Add creator as admin for each existing project
INSERT INTO public.project_members (project_id, user_id, role, joined_at)
SELECT p.id, p.created_by, 'admin', p.created_at
FROM public.projects p
WHERE NOT EXISTS (
  SELECT 1 FROM public.project_members pm 
  WHERE pm.project_id = p.id AND pm.user_id = p.created_by
)
ON CONFLICT (project_id, user_id) DO NOTHING;

-- Step 6: Add helpful comments
COMMENT ON TABLE public.project_members IS 'Tracks user roles (admin/member) within each project';
COMMENT ON COLUMN public.project_members.role IS 'admin = can assign tasks and see all; member = can create and see own + unassigned';
COMMENT ON COLUMN public.projects.admin_id IS 'First admin who created the project (informational, actual role stored in project_members)';
