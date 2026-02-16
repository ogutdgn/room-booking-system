"use client";

import {
  type Room,
  type RecurrenceConfig,
  formatTime,
  DAY_NAMES_SHORT,
} from "@/lib/booking-data";
import { Button } from "@/components/ui/button";

interface ReviewConfirmProps {
  room: Room;
  date: string;
  startTime: string;
  endTime: string;
  fullName: string;
  email: string;
  peopleCount: number;
  recurrence: RecurrenceConfig | null;
  onConfirm: () => void;
  isSubmitting: boolean;
}

function getRecurrenceLabel(config: RecurrenceConfig | null): string {
  if (!config) return "One-time";
  switch (config.type) {
    case "daily":
      return `Every weekday for ${config.repeatWeeks} weeks`;
    case "weekly":
      return `Weekly for ${config.repeatWeeks} weeks`;
    case "custom":
      if (config.customDays?.length) {
        const days = config.customDays
          .sort((a, b) => a - b)
          .map((d) => DAY_NAMES_SHORT[d])
          .join(", ");
        return `${days} for ${config.repeatWeeks} weeks`;
      }
      return "Custom";
    default:
      return "One-time";
  }
}

export function ReviewConfirm({
  room,
  date,
  startTime,
  endTime,
  fullName,
  email,
  peopleCount,
  recurrence,
  onConfirm,
  isSubmitting,
}: ReviewConfirmProps) {
  const displayDate = new Date(date + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const details = [
    { label: "Room", value: room.name },
    { label: "Date", value: displayDate },
    {
      label: "Time",
      value: `${formatTime(startTime)} - ${formatTime(endTime)}`,
    },
    { label: "Frequency", value: getRecurrenceLabel(recurrence) },
    { label: "People", value: `${peopleCount}` },
    { label: "Name", value: fullName },
    { label: "Email", value: email },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground">
          Review your booking
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Please confirm all details before reserving.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 flex flex-col gap-3">
        {details.map((item) => (
          <div key={item.label} className="flex justify-between text-sm">
            <span className="text-muted-foreground">{item.label}</span>
            <span className="font-medium text-card-foreground text-right">
              {item.value}
            </span>
          </div>
        ))}
      </div>

      <Button onClick={onConfirm} className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Requesting..." : "Request booking"}
      </Button>
    </div>
  );
}
