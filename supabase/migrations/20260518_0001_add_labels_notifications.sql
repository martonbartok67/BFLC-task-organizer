-- Migration: Add labels column to tasks and create notifications table (Phase 10)
-- Purpose: Enable task labeling and notification system for deadline accountability

-- Add labels column to tasks
ALTER TABLE tasks 
ADD COLUMN labels JSONB DEFAULT '[]'::jsonb;

-- Create notifications table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('due_soon', 'overdue', 'assigned', 'comment')),
  read_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(user_id, task_id, type)
);

-- Create indexes for common queries
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_task_id ON notifications(task_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id) WHERE read_at IS NULL;
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- Enable RLS on notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users see only their own notifications
CREATE POLICY "users_view_own_notifications" 
  ON notifications FOR SELECT 
  USING (auth.uid() = user_id);

-- RLS Policy: Only the system can insert notifications (via RPC or trigger)
-- Users cannot directly insert, preventing spam
CREATE POLICY "system_insert_notifications" 
  ON notifications FOR INSERT 
  WITH CHECK (false); -- Disabled for direct inserts

-- RLS Policy: Users can mark their own notifications as read
CREATE POLICY "users_update_own_notifications" 
  ON notifications FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can delete their own notifications
CREATE POLICY "users_delete_own_notifications" 
  ON notifications FOR DELETE 
  USING (auth.uid() = user_id);

-- Add predefined labels type for consistency
CREATE TYPE notification_type AS ENUM ('due_soon', 'overdue', 'assigned', 'comment');
