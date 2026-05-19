"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CalendarEvent, Profile } from "@/types/domain";

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (event: Omit<CalendarEvent, "id" | "createdBy" | "createdAt" | "updatedAt">) => Promise<void>;
  teamMembers: Profile[];
  selectedDate?: Date;
}

export function CreateEventModal({
  isOpen,
  onClose,
  onCreate,
  teamMembers,
  selectedDate
}: CreateEventModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize datetime on modal open with selected date
  useEffect(() => {
    if (isOpen && selectedDate) {
      const dateStr = selectedDate.toISOString().split("T")[0];
      setStartTime(`${dateStr}T09:00`);
      setEndTime(`${dateStr}T10:00`);
    }
  }, [isOpen, selectedDate]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (!title || !startTime || !endTime) {
        setError("Title, start time, and end time are required");
        setIsLoading(false);
        return;
      }

      // Parse datetime-local format (YYYY-MM-DDTHH:mm)
      const startDateTime = new Date(startTime + ":00Z").toISOString();
      const endDateTime = new Date(endTime + ":00Z").toISOString();

      if (new Date(endDateTime) <= new Date(startDateTime)) {
        setError("End time must be after start time");
        setIsLoading(false);
        return;
      }

      await onCreate({
        projectId: "", // Will be set by parent
        taskId: null,
        title,
        description: description || null,
        startTime: startDateTime,
        endTime: endDateTime,
        memberIds: selectedMembers
      });

      // Reset form
      setTitle("");
      setDescription("");
      setStartTime("");
      setEndTime("");
      setSelectedMembers([]);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create event");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMember = (memberId: string) => {
    setSelectedMembers((prev) =>
      prev.includes(memberId)
        ? prev.filter((id) => id !== memberId)
        : [...prev, memberId]
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-flc-text">Create Event</h2>
          <button
            onClick={onClose}
            className="rounded hover:bg-flc-panel-muted p-1"
          >
            <X size={20} className="text-flc-text-muted" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-flc-text mb-1">
              Event Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Design Review"
              className="w-full rounded border border-flc-border bg-white px-3 py-2 text-sm text-flc-text placeholder-flc-text-muted focus:border-flc-accent focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-flc-text mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional details..."
              rows={3}
              className="w-full rounded border border-flc-border bg-white px-3 py-2 text-sm text-flc-text placeholder-flc-text-muted focus:border-flc-accent focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-flc-text mb-1">
              Start Date & Time *
            </label>
            <input
              type="datetime-local"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full rounded border border-flc-border bg-white px-3 py-2 text-sm text-flc-text focus:border-flc-accent focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-flc-text mb-1">
              End Date & Time *
            </label>
            <input
              type="datetime-local"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full rounded border border-flc-border bg-white px-3 py-2 text-sm text-flc-text focus:border-flc-accent focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-flc-text mb-2">
              Invite Members
            </label>
            <div className="space-y-2 max-h-40 overflow-y-auto border border-flc-border rounded p-2 bg-flc-panel-muted">
              {teamMembers.length === 0 ? (
                <p className="text-xs text-flc-text-muted">No team members available</p>
              ) : (
                teamMembers.map((member) => (
                  <label key={member.id} className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedMembers.includes(member.id)}
                      onChange={() => toggleMember(member.id)}
                      className="h-4 w-4 rounded border-flc-border text-flc-accent"
                    />
                    <span className="ml-2 text-sm text-flc-text">{member.fullName}</span>
                  </label>
                ))
              )}
            </div>
          </div>

          {error && <p className="text-sm text-flc-danger">{error}</p>}

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? "Creating..." : "Create Event"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
