-- Migration: Create RPC function to manage task notifications (Phase 10)
-- Purpose: Automatically create notifications when tasks are assigned or near due

-- RPC: Create notification for task assignment
CREATE OR REPLACE FUNCTION create_assignment_notification(
  p_task_id UUID,
  p_assignee_id UUID
) RETURNS void AS $$
BEGIN
  INSERT INTO notifications (user_id, task_id, type)
  VALUES (p_assignee_id, p_task_id, 'assigned')
  ON CONFLICT (user_id, task_id, type) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC: Create due-soon notification (called by cron job or trigger)
CREATE OR REPLACE FUNCTION check_due_soon_notifications() RETURNS void AS $$
DECLARE
  v_task RECORD;
BEGIN
  -- Find tasks due within 24 hours that don't have notification yet
  FOR v_task IN
    SELECT t.id, t.assignee_id
    FROM tasks t
    WHERE t.due_date IS NOT NULL
      AND t.due_date > NOW()
      AND t.due_date <= NOW() + INTERVAL '24 hours'
      AND t.assignee_id IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM notifications n
        WHERE n.task_id = t.id
          AND n.user_id = t.assignee_id
          AND n.type = 'due_soon'
      )
  LOOP
    INSERT INTO notifications (user_id, task_id, type)
    VALUES (v_task.assignee_id, v_task.id, 'due_soon');
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC: Create overdue notification
CREATE OR REPLACE FUNCTION check_overdue_notifications() RETURNS void AS $$
DECLARE
  v_task RECORD;
BEGIN
  -- Find overdue tasks that don't have notification yet
  FOR v_task IN
    SELECT t.id, t.assignee_id
    FROM tasks t
    WHERE t.due_date IS NOT NULL
      AND t.due_date < NOW()
      AND t.status != 'done'
      AND t.assignee_id IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM notifications n
        WHERE n.task_id = t.id
          AND n.user_id = t.assignee_id
          AND n.type = 'overdue'
      )
  LOOP
    INSERT INTO notifications (user_id, task_id, type)
    VALUES (v_task.assignee_id, v_task.id, 'overdue');
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create assignment notification when task is assigned
CREATE OR REPLACE FUNCTION notify_on_assignment() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.assignee_id IS NOT NULL AND (OLD.assignee_id IS NULL OR OLD.assignee_id != NEW.assignee_id) THEN
    PERFORM create_assignment_notification(NEW.id, NEW.assignee_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists (to avoid conflicts)
DROP TRIGGER IF EXISTS task_assignment_notification ON tasks;

-- Create trigger
CREATE TRIGGER task_assignment_notification
AFTER INSERT OR UPDATE ON tasks
FOR EACH ROW
EXECUTE FUNCTION notify_on_assignment();

-- Grant execute permissions to authenticated users for check functions
GRANT EXECUTE ON FUNCTION check_due_soon_notifications() TO authenticated;
GRANT EXECUTE ON FUNCTION check_overdue_notifications() TO authenticated;
GRANT EXECUTE ON FUNCTION create_assignment_notification(UUID, UUID) TO authenticated;
