"use client";

import { useEffect, useMemo, useState } from "react";
import {
  addDays,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek
} from "date-fns";
import { CalendarSync, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SectionHeader } from "@/components/ui/section-header";
import { CreateEventModal } from "@/components/calendar/create-event-modal";
import { EventCard } from "@/components/calendar/event-card";
import type { Task, CalendarEvent, CalendarEventWithMembers, Profile } from "@/types/domain";

type CalendarTask = Task;

export default function CalendarPage() {
  const [tasks, setTasks] = useState<CalendarTask[]>([]);
  const [events, setEvents] = useState<CalendarEventWithMembers[]>([]);
  const [teamMembers, setTeamMembers] = useState<Profile[]>([]);
  const [month, setMonth] = useState(new Date());
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();

  async function loadTasks() {
    setLoading(true);
    const response = await fetch("/api/tasks");
    const payload = await response.json();
    if (!response.ok) {
      setError(payload.error ?? "Could not load tasks.");
      setLoading(false);
      return;
    }
    setTasks(payload.data ?? []);
    setLoading(false);
  }

  async function loadEvents() {
    const response = await fetch("/api/calendar-events");
    const payload = await response.json();
    if (!response.ok) {
      setError(payload.error ?? "Could not load events.");
      return;
    }
    setEvents(payload.data ?? []);
  }

  async function loadTeamMembers() {
    const response = await fetch("/api/projects/members");
    const payload = await response.json();
    if (!response.ok) {
      return;
    }
    setTeamMembers(payload.data ?? []);
  }

  useEffect(() => {
    loadTasks();
    loadEvents();
    loadTeamMembers();
  }, []);

  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(month), { weekStartsOn: 1 });
    const days: Date[] = [];
    let current = start;
    while (current <= end) {
      days.push(current);
      current = addDays(current, 1);
    }
    return days;
  }, [month]);

  function tasksByDay(day: Date) {
    return tasks.filter((task) => {
      const due = task.dueDate ? new Date(task.dueDate) : null;
      return due ? isSameDay(due, day) : false;
    });
  }

  function eventsByDay(day: Date) {
    return events.filter((event) => {
      const start = new Date(event.startTime);
      return isSameDay(start, day);
    });
  }

  async function handleCreateEvent(data: Omit<CalendarEvent, "id" | "createdBy" | "createdAt" | "updatedAt">) {
    try {
      const response = await fetch("/api/calendar-events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: data.title,
          description: data.description,
          startTime: data.startTime,
          endTime: data.endTime,
          taskId: data.taskId,
          memberIds: data.memberIds
        })
      });

      if (!response.ok) {
        const payload = await response.json();
        setError(payload.error ?? "Could not create event");
        return;
      }

      await loadEvents();
      setCreateModalOpen(false);
      setStatus("Event created successfully");
      setTimeout(() => setStatus(null), 3000);
    } catch (err) {
      setError("Failed to create event");
    }
  }

  async function handleNotifyEvent(eventId: string) {
    try {
      const response = await fetch(`/api/calendar-events/${eventId}/notify`, {
        method: "POST"
      });

      if (!response.ok) {
        const payload = await response.json();
        setError(payload.error ?? "Could not send notification");
        return;
      }

      const payload = await response.json();
      setStatus(payload.data?.message ?? "Notifications sent");
      setTimeout(() => setStatus(null), 3000);
    } catch (err) {
      setError("Failed to send notifications");
    }
  }

  async function handleDeleteEvent(eventId: string) {
    try {
      const response = await fetch(`/api/calendar-events/${eventId}`, {
        method: "DELETE"
      });

      if (!response.ok) {
        const payload = await response.json();
        setError(payload.error ?? "Could not delete event");
        return;
      }

      await loadEvents();
      setStatus("Event deleted");
      setTimeout(() => setStatus(null), 3000);
    } catch (err) {
      setError("Failed to delete event");
    }
  }

  async function sync(direction: "push" | "pull") {
    setError(null);
    setStatus(null);
    const response = await fetch(`/api/google/sync/${direction}`, { method: "POST" });
    const payload = await response.json();
    if (!response.ok) {
      setError(payload.error ?? `Could not ${direction} calendar sync.`);
      return;
    }
    setStatus(
      direction === "push"
        ? `Pushed ${payload.data.syncedTasks ?? 0} task schedule items to Google Calendar.`
        : `Pulled ${payload.data.totalEvents ?? 0} Google events into tasks.`
    );
    await loadTasks();
  }

  return (
    <div>
      <SectionHeader
        title="Calendar View"
        subtitle="Track task deadlines and manage events with team notifications."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => setCreateModalOpen(true)}>
              <Plus size={14} className="mr-2" />
              New Event
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                window.location.href = "/api/google/connect";
              }}
            >
              Connect Google
            </Button>
            <Button onClick={() => sync("push")}>
              <CalendarSync size={14} className="mr-2" />
              Push
            </Button>
            <Button variant="secondary" onClick={() => sync("pull")}>
              Pull
            </Button>
          </div>
        }
      />

      {status ? <p className="mb-3 text-sm text-emerald-700">{status}</p> : null}
      {error ? <p className="mb-3 text-sm text-flc-danger">{error}</p> : null}
      {loading ? <p className="mb-3 text-sm text-flc-text-muted">Loading tasks...</p> : null}

      <Card className="p-0">
        <div className="flex items-center justify-between border-b border-flc-border px-4 py-3">
          <Button variant="ghost" size="sm" onClick={() => setMonth(addDays(startOfMonth(month), -1))}>
            <ChevronLeft size={16} />
          </Button>
          <h3 className="text-sm font-semibold text-flc-text">{format(month, "MMMM yyyy")}</h3>
          <Button variant="ghost" size="sm" onClick={() => setMonth(addDays(endOfMonth(month), 1))}>
            <ChevronRight size={16} />
          </Button>
        </div>

        <div className="grid grid-cols-7 border-b border-flc-border bg-flc-panel-muted text-xs font-medium text-flc-text-muted">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
            <div key={day} className="border-r border-flc-border px-2 py-2 text-center last:border-r-0">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {calendarDays.map((day) => {
            const dayTasks = tasksByDay(day);
            const dayEvents = eventsByDay(day);
            const allItems = [...dayTasks, ...dayEvents];
            return (
              <div
                key={day.toISOString()}
                className={`min-h-[150px] border-r border-b border-flc-border p-2 last:border-r-0 cursor-pointer hover:bg-flc-panel-muted transition-colors ${
                  isSameMonth(day, month) ? "bg-white" : "bg-[#f5f7f9]"
                }`}
                onClick={() => {
                  setSelectedDate(day);
                  setCreateModalOpen(true);
                }}
              >
                <p className="mb-2 text-xs font-semibold text-flc-text">{format(day, "d")}</p>
                <div className="space-y-1">
                  {dayTasks.slice(0, 2).map((task) => (
                    <div key={task.id} className="rounded-md border border-flc-border bg-flc-panel-muted px-2 py-1">
                      <p className="line-clamp-1 text-[11px] font-medium text-flc-text">{task.title}</p>
                      {task.isMilestone ? <Badge className="mt-1 text-[9px]">Milestone</Badge> : null}
                    </div>
                  ))}
                  {dayEvents.slice(0, 1).map((event) => (
                    <EventCard key={event.id} event={event} isCompact onNotify={() => handleNotifyEvent(event.id)} onEdit={() => {}} onDelete={() => handleDeleteEvent(event.id)} />
                  ))}
                  {allItems.length > 3 ? (
                    <p className="text-[11px] text-flc-text-muted">+{allItems.length - 3} more</p>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <CreateEventModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCreate={handleCreateEvent}
        teamMembers={teamMembers}
        selectedDate={selectedDate}
      />
    </div>
  );
}
