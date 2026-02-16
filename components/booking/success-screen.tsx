"use client";

import Link from "next/link";
import { CheckCircle2, AlertTriangle } from "lucide-react";
import {
  type Room,
  type RecurrenceConfig,
  formatTime,
  DAY_NAMES_SHORT,
} from "@/lib/booking-data";
import { Button } from "@/components/ui/button";

interface SuccessScreenProps {
  room: Room;
  date: string;
  startTime: string;
  endTime: string;
  fullName: string;
  peopleCount: number;
  recurrence?: RecurrenceConfig | null;
  bookedDates?: string[];
  conflictDates?: string[];
}

export function SuccessScreen({
  room,
  date,
  startTime,
  endTime,
  fullName,
  peopleCount,
  recurrence,
  bookedDates,
  conflictDates,
}: SuccessScreenProps) {
  const displayDate = new Date(date + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const isRecurring = recurrence && recurrence.type !== "none";

  return (
    <div className="flex flex-col items-center gap-8 py-8">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent/10">
          <CheckCircle2 className="h-8 w-8 text-accent" />
        </div>
        <h2 className="text-2xl font-semibold text-foreground">
          {isRecurring ? "Recurring reservation confirmed" : "Reservation confirmed"}
        </h2>
        <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
          {isRecurring
            ? "Your recurring bookings have been created. Others will see this room as unavailable during your reserved times."
            : "Your room has been booked. Others will see this room as unavailable during your reserved time."}
        </p>
      </div>

      <div className="w-full rounded-2xl border border-border bg-card p-6 flex flex-col gap-3">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Room</span>
          <span className="font-medium text-card-foreground">{room.name}</span>
        </div>
        {!isRecurring && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Date</span>
            <span className="font-medium text-card-foreground">
              {displayDate}
            </span>
          </div>
        )}
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Time</span>
          <span className="font-medium text-card-foreground">
            {formatTime(startTime)} - {formatTime(endTime)}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Booked by</span>
          <span className="font-medium text-card-foreground">{fullName}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">People</span>
          <span className="font-medium text-card-foreground">
            {peopleCount}
          </span>
        </div>
      </div>

      {/* Recurring details */}
      {isRecurring && bookedDates && bookedDates.length > 0 && (
        <div className="w-full rounded-2xl border border-accent/20 bg-accent/5 p-5 flex flex-col gap-3">
          <p className="text-sm font-medium text-foreground">
            {bookedDates.length} date{bookedDates.length > 1 ? "s" : ""} booked
          </p>
          <div className="flex flex-wrap gap-2">
            {bookedDates.map((d) => {
              const dt = new Date(d + "T00:00:00");
              return (
                <span
                  key={d}
                  className="inline-flex items-center rounded-md bg-card border border-border px-2.5 py-1 text-xs font-medium text-card-foreground"
                >
                  {DAY_NAMES_SHORT[dt.getDay()]}{" "}
                  {dt.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Conflict dates */}
      {isRecurring && conflictDates && conflictDates.length > 0 && (
        <div className="w-full rounded-2xl border border-destructive/20 bg-destructive/5 p-5 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <p className="text-sm font-medium text-foreground">
              {conflictDates.length} date{conflictDates.length > 1 ? "s" : ""}{" "}
              skipped (already booked)
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {conflictDates.map((d) => {
              const dt = new Date(d + "T00:00:00");
              return (
                <span
                  key={d}
                  className="inline-flex items-center rounded-md bg-card border border-destructive/20 px-2.5 py-1 text-xs font-medium text-muted-foreground line-through"
                >
                  {DAY_NAMES_SHORT[dt.getDay()]}{" "}
                  {dt.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex gap-3 w-full">
        <Button variant="outline" className="flex-1 bg-transparent" asChild>
          <Link href="/">Go home</Link>
        </Button>
        <Button className="flex-1" asChild>
          <Link href="/book/manual">Book another</Link>
        </Button>
      </div>
    </div>
  );
}
