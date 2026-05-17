"use client";

import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AVAILABLE_LABELS, LABEL_COLORS } from "@/lib/constants";

interface LabelEditorProps {
  value: string[];
  onChange: (labels: string[]) => void;
  disabled?: boolean;
}

export function LabelEditor({ value, onChange, disabled = false }: LabelEditorProps) {
  const toggleLabel = (label: string) => {
    if (value.includes(label)) {
      onChange(value.filter((l) => l !== label));
    } else {
      onChange([...value, label]);
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-flc-text">Labels</label>
      <div className="space-y-3">
        {/* Label selector buttons */}
        <div className="flex flex-wrap gap-2">
          {AVAILABLE_LABELS.map(({ label }) => (
            <button
              key={label}
              onClick={() => toggleLabel(label)}
              disabled={disabled}
              className={`rounded-full px-3 py-1.5 text-sm font-medium border transition-all duration-200 capitalize ${
                value.includes(label)
                  ? `${LABEL_COLORS[label]} border-current ring-2 ring-offset-1`
                  : `bg-white border-flc-border text-flc-text hover:border-flc-primary/50`
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Selected labels display */}
        {value.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2 border-t border-flc-border">
            {value.map((label) => (
              <Badge key={label} className={`${LABEL_COLORS[label]} gap-1.5 capitalize`}>
                <span>{label}</span>
                <button
                  onClick={() => toggleLabel(label)}
                  disabled={disabled}
                  className="ml-1 hover:opacity-70 disabled:opacity-50"
                  type="button"
                >
                  <X size={12} />
                </button>
              </Badge>
            ))}
          </div>
        )}

        {value.length === 0 && (
          <p className="text-xs text-flc-text-muted italic">No labels selected</p>
        )}
      </div>
    </div>
  );
}
