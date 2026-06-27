"use client";

import { useState } from "react";
import { Bell, Trash2, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CalendarEventWithMembers } from "@/types/domain";

interface EventCardProps {
  event: CalendarEventWithMembers;
  onNotify: () => Promise<void>;
  onEdit: () => void;
  onDelete: () => Promise<void>;
  isCompact?: boolean;
}

export function EventCard({
  event,
  onNotify,
  onEdit,
  onDelete,
  isCompact = false
}: EventCardProps) {
  const [isNotifying, setIsNotifying] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showActions, setShowActions] = useState(false);

  const handleNotify = async () => {
    setIsNotifying(true);
    try {
      await onNotify();
    } finally {
      setIsNotifying(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this event?")) return;
    setIsDeleting(true);
    try {
      await onDelete();
    } finally {
      setIsDeleting(false);
    }
  };

  if (isCompact) {
    return (
      <div className="rounded-md border border-flc-border bg-flc-panel-muted px-2 py-1 transition-colors hover:border-flc-primary/40">
        <p className="line-clamp-1 text-[11px] font-medium text-[#1a1a1a]">{event.title}</p>
        {event.members.length > 0 && (
          <p className="text-[10px] text-[#8a92a0]">
            {event.members.length} member{event.members.length > 1 ? "s" : ""}
          </p>
        )}
      </div>
    );
  }

  return (
    <div
      className="relative rounded-lg border border-flc-border bg-white p-4 transition-colors hover:border-flc-primary/40"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="mb-2">
        <h4 className="font-semibold text-[#1a1a1a]">{event.title}</h4>
        {event.description && (
          <p className="text-xs text-[#8a92a0] mt-1">{event.description}</p>
        )}
      </div>

      <div className="mb-3 text-xs text-[#8a92a0] space-y-1">
        <p>
          📅{" "}
          {new Date(event.startTime).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric"
          })}
          {new Date(event.startTime).toDateString() !==
          new Date(event.endTime).toDateString()
            ? ` - ${new Date(event.endTime).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric"
              })}`
            : ""}
        </p>
      </div>

      {event.members.length > 0 && (
        <div className="mb-3">
          <p className="text-xs font-medium text-flc-text mb-1">Members:</p>
          <div className="flex flex-wrap gap-1">
            {event.members.slice(0, 3).map((member) => (
              <span
                key={member.id}
                className="inline-block rounded-full bg-flc-panel-muted px-2 py-1 text-[10px] text-[#1a1a1a]"
              >
                {member.fullName}
              </span>
            ))}
            {event.members.length > 3 && (
              <span className="inline-block rounded-full bg-flc-panel-muted px-2 py-1 text-[10px] text-[#8a92a0]">
                +{event.members.length - 3}
              </span>
            )}
          </div>
        </div>
      )}

      {showActions && (
        <div className="flex gap-2 pt-3 border-t border-[#d5dce5]">
          <Button
            size="sm"
            variant="secondary"
            onClick={handleNotify}
            disabled={isNotifying}
            className="flex-1 gap-1 h-8"
          >
            <Bell size={14} />
            {isNotifying ? "Sending..." : "Notify"}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={onEdit}
            disabled={isNotifying || isDeleting}
            className="h-8 px-2"
          >
            <Edit2 size={14} />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleDelete}
            disabled={isDeleting || isNotifying}
            className="h-8 px-2 text-flc-danger hover:bg-red-50"
          >
            <Trash2 size={14} />
          </Button>
        </div>
      )}
    </div>
  );
}
