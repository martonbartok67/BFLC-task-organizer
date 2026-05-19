import type { Notification } from "@/types/domain";

/**
 * Calculate relative time string for notification display
 * e.g., "2 hours ago", "yesterday", "3 days ago"
 */
export function getRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/**
 * Get notification icon and color based on type
 */
export function getNotificationStyle(type: string) {
  const styles: Record<string, { bgColor: string; textColor: string; icon: string }> = {
    due_soon: {
      bgColor: "bg-blue-100",
      textColor: "text-blue-900",
      icon: "⏰"
    },
    overdue: {
      bgColor: "bg-red-100",
      textColor: "text-red-900",
      icon: "🔴"
    },
    assigned: {
      bgColor: "bg-purple-100",
      textColor: "text-purple-900",
      icon: "👤"
    },
    comment: {
      bgColor: "bg-green-100",
      textColor: "text-green-900",
      icon: "💬"
    },
    event_reminder: {
      bgColor: "bg-orange-100",
      textColor: "text-orange-900",
      icon: "📅"
    }
  };

  return styles[type] || styles.assigned;
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(notificationId: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/notifications/${notificationId}/read`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" }
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsAsRead(): Promise<boolean> {
  try {
    const response = await fetch("/api/notifications/read-all", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" }
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Delete notification
 */
export async function deleteNotification(notificationId: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/notifications/${notificationId}`, {
      method: "DELETE"
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Get notification message based on type
 */
export function getNotificationMessage(type: string, title: string): string {
  const messages: Record<string, string> = {
    due_soon: `"${title}" is due soon`,
    overdue: `"${title}" is overdue`,
    assigned: `You were assigned to "${title}"`,
    comment: `New comment on "${title}"`,
    event_reminder: `"${title}" is coming up - be prepared!`
  };

  return messages[type] || title;
}
