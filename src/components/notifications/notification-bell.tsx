"use client";

import { useEffect, useState } from "react";
import { Bell, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Notification } from "@/types/domain";
import { getRelativeTime, getNotificationStyle, getNotificationMessage, markNotificationAsRead, deleteNotification } from "@/lib/notifications";

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Fetch notifications on mount and set up polling
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, []);

  async function fetchNotifications() {
    try {
      setLoading(true);
      const response = await fetch("/api/notifications");
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleMarkAsRead(notificationId: string) {
    const success = await markNotificationAsRead(notificationId);
    if (success) {
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, readAt: new Date().toISOString() } : n
        )
      );
    }
  }

  async function handleDelete(notificationId: string) {
    const success = await deleteNotification(notificationId);
    if (success) {
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    }
  }

  const unreadCount = notifications.filter((n) => !n.readAt).length;

  return (
    <div className="relative">
      {/* Notification Bell Button */}
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg hover:bg-flc-panel-muted transition-colors duration-200"
        aria-label="Notifications"
      >
        <Bell size={20} className="text-flc-text" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center h-5 w-5 rounded-full text-xs font-bold bg-red-500 text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg border border-flc-border shadow-lg z-50">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-flc-border">
            <h3 className="font-semibold text-flc-text">Notifications</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setOpen(false)}
              className="h-6 w-6 p-0"
            >
              <X size={16} />
            </Button>
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center text-flc-text-muted">
                <p className="text-sm">Loading...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-flc-text-muted">
                <p className="text-sm">No notifications yet</p>
              </div>
            ) : (
              <div className="divide-y divide-flc-border">
                {notifications.map((notification) => {
                  const style = getNotificationStyle(notification.type);
                  const isRead = !!notification.readAt;

                  return (
                    <div
                      key={notification.id}
                      className={`p-4 transition-colors duration-200 ${
                        isRead ? "bg-white" : "bg-blue-50"
                      } hover:bg-flc-panel-muted`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Icon */}
                        <div className={`mt-1 rounded-full p-2 ${style.bgColor}`}>
                          <span className="text-lg">{style.icon}</span>
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium ${style.textColor} truncate`}>
                            {notification.type.replace("_", " ").charAt(0).toUpperCase() +
                              notification.type.replace("_", " ").slice(1)}
                          </p>
                          <p className="text-sm text-flc-text mt-0.5 line-clamp-2">
                            {/* Placeholder - would need task title from API */}
                            Task notification
                          </p>
                          <p className="text-xs text-flc-text-muted mt-1">
                            {getRelativeTime(notification.createdAt)}
                          </p>
                        </div>

                        {/* Close Button */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(notification.id)}
                          className="h-6 w-6 p-0 shrink-0 hover:bg-red-100"
                        >
                          <X size={14} />
                        </Button>
                      </div>

                      {/* Mark as Read Button (if unread) */}
                      {!isRead && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMarkAsRead(notification.id)}
                          className="mt-2 w-full text-xs text-flc-primary hover:bg-flc-primary/10"
                        >
                          Mark as read
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Overlay to close dropdown */}
      {open && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setOpen(false)}
        />
      )}
    </div>
  );
}
