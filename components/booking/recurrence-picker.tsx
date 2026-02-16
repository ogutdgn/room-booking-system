"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  type RecurrenceType,
  type RecurrenceConfig,
  DAY_NAMES_SHORT,
} from "@/lib/booking-data";
import { Button } from "@/components/ui/button";

interface RecurrencePickerProps {
  onSelect: (config: RecurrenceConfig | null) => void;
}

const RECURRENCE_OPTIONS: { type: RecurrenceType; label: string; description: string }[] = [
  {
    type: "none",
    label: "One-time",
    description: "Book only for the selected date",
  },
  {
    type: "daily",
    label: "Every weekday",
    description: "Monday through Friday, skipping weekends",
  },
  {
    type: "weekly",
    label: "Weekly",
    description: "Same day every week",
  },
  {
    type: "custom",
    label: "Custom",
    description: "Choose specific days of the week",
  },
];

const WEEK_OPTIONS = [2, 4, 8, 12];

export function RecurrencePicker({ onSelect }: RecurrencePickerProps) {
  const [selectedType, setSelectedType] = useState<RecurrenceType>("none");
  const [customDays, setCustomDays] = useState<number[]>([]);
  const [repeatWeeks, setRepeatWeeks] = useState<number>(4);

  const toggleDay = (day: number) => {
    setCustomDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
  };

  const handleContinue = () => {
    if (selectedType === "none") {
      onSelect(null);
    } else {
      onSelect({
        type: selectedType,
        repeatWeeks,
        ...(selectedType === "custom" ? { customDays } : {}),
      });
    }
  };

  const isCustomValid =
    selectedType !== "custom" || customDays.length > 0;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground">
          Booking frequency
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Book once or set up a recurring reservation.
        </p>
      </div>

      {/* Recurrence type cards */}
      <div className="flex flex-col gap-2">
        {RECURRENCE_OPTIONS.map((option) => (
          <button
            key={option.type}
            type="button"
            onClick={() => setSelectedType(option.type)}
            className={cn(
              "flex flex-col gap-1 rounded-xl border p-4 text-left transition-colors",
              selectedType === option.type
                ? "border-foreground bg-foreground/[0.03]"
                : "border-border bg-card hover:border-foreground/20",
            )}
          >
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "flex h-5 w-5 items-center justify-center rounded-full border-2 transition-colors",
                  selectedType === option.type
                    ? "border-foreground"
                    : "border-muted-foreground/40",
                )}
              >
                {selectedType === option.type && (
                  <div className="h-2.5 w-2.5 rounded-full bg-foreground" />
                )}
              </div>
              <span className="text-sm font-medium text-foreground">
                {option.label}
              </span>
            </div>
            <p className="ml-8 text-xs text-muted-foreground">
              {option.description}
            </p>
          </button>
        ))}
      </div>

      {/* Custom days picker */}
      {selectedType === "custom" && (
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-foreground">
            Select days
          </label>
          <div className="flex gap-2">
            {DAY_NAMES_SHORT.map((name, idx) => (
              <button
                key={name}
                type="button"
                onClick={() => toggleDay(idx)}
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-lg border text-xs font-medium transition-colors",
                  customDays.includes(idx)
                    ? "border-foreground bg-foreground text-background"
                    : "border-border bg-card text-foreground hover:border-foreground/30",
                )}
              >
                {name.charAt(0)}
              </button>
            ))}
          </div>
          {customDays.length > 0 && (
            <p className="text-xs text-muted-foreground">
              {customDays
                .sort((a, b) => a - b)
                .map((d) => DAY_NAMES_SHORT[d])
                .join(", ")}
            </p>
          )}
        </div>
      )}

      {/* Duration (for recurring types) */}
      {selectedType !== "none" && (
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-foreground">
            Repeat for
          </label>
          <div className="flex gap-2">
            {WEEK_OPTIONS.map((w) => (
              <button
                key={w}
                type="button"
                onClick={() => setRepeatWeeks(w)}
                className={cn(
                  "rounded-lg border px-4 py-2 text-sm font-medium transition-colors",
                  repeatWeeks === w
                    ? "border-foreground bg-foreground text-background"
                    : "border-border bg-card text-foreground hover:border-foreground/30",
                )}
              >
                {w} weeks
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <Button
        onClick={handleContinue}
        disabled={!isCustomValid}
        className="w-full"
      >
        Continue
      </Button>
    </div>
  );
}
