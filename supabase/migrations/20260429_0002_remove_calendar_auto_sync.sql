-- Phase 1: Remove Calendar Auto-Sync and Simplify Task Status
-- This migration:
-- 1. Deletes all calendar event links (fresh start)
-- 2. Prepares calendar_connections for future per-user preferences
-- 3. Creates new simplified task status enum (todo, in_progress, done)
-- 4. Migrates existing tasks to new statuses
-- 5. Updates board columns to match new status types

-- Step 1: Delete all calendar event links (fresh start)
DELETE FROM public.calendar_event_links;

-- Step 2: Add user_id column to calendar_connections for future per-user preferences
ALTER TABLE public.calendar_connections 
ADD COLUMN user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Step 3: Create new simplified task status enum
-- First, create the new enum
CREATE TYPE public.task_status_new AS ENUM ('todo', 'in_progress', 'done');

-- Step 4: Migrate existing tasks to new status
-- Create a new column with the new enum type
ALTER TABLE public.tasks
ADD COLUMN status_new public.task_status_new;

-- Map old statuses to new ones:
-- backlog → todo
-- todo → todo
-- in_progress → in_progress
-- review → in_progress (review stage is removed)
-- done → done
UPDATE public.tasks 
SET status_new = CASE 
  WHEN status = 'backlog' THEN 'todo'::public.task_status_new
  WHEN status = 'todo' THEN 'todo'::public.task_status_new
  WHEN status = 'in_progress' THEN 'in_progress'::public.task_status_new
  WHEN status = 'review' THEN 'in_progress'::public.task_status_new
  WHEN status = 'done' THEN 'done'::public.task_status_new
END;

-- Verify the migration
-- SELECT COUNT(*) as total, status_new, COUNT(CASE WHEN status_new IS NULL THEN 1 END) as nulls
-- FROM public.tasks GROUP BY status_new;

-- Drop old status column and replace with new enum
ALTER TABLE public.tasks DROP COLUMN status;
ALTER TABLE public.tasks RENAME COLUMN status_new TO status;

-- Drop old enum
DROP TYPE public.task_status;

-- Rename new enum to standard name
ALTER TYPE public.task_status_new RENAME TO task_status;

-- Step 5: Update board columns
-- Delete old columns (backlog and review are no longer needed)
DELETE FROM public.board_columns WHERE key::text NOT IN ('todo', 'in_progress', 'done');

-- Update positions for remaining columns to be sequential
UPDATE public.board_columns SET position = 0 WHERE key::text = 'todo';
UPDATE public.board_columns SET position = 1 WHERE key::text = 'in_progress';
UPDATE public.board_columns SET position = 2 WHERE key::text = 'done';

-- Verify board columns
-- SELECT project_id, key, name, position FROM public.board_columns ORDER BY position;

-- Add comment for future reference
COMMENT ON COLUMN public.calendar_connections.user_id IS 'For future per-user calendar preferences. Currently NULL for shared calendar.';
