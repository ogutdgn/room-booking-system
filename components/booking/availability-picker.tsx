"use client";

import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import {
  type Room,
  TIME_SLOTS,
  formatTime,
  getBookingsForRoom,
} from "@/lib/booking-data";
import { Button } from "@/components/ui/button";

interface AvailabilityPickerProps {
  room: Room;
  onSelect: (date: string, startTime: string, endTime: string) => void;
}

export function AvailabilityPicker({
  room,
  onSelect,
}: AvailabilityPickerProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [startSlotIdx, setStartSlotIdx] = useState<number | null>(null);
  const [endSlotIdx, setEndSlotIdx] = useState<number | null>(null);

  // Selectable slots are indices 0..N-2 (each represents a 30-min block ending at the next slot)
  const selectableSlots = TIME_SLOTS.slice(0, -1);

  // Generate 7 days starting from today
  const days = useMemo(() => {
    const result: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      result.push(d);
    }
    return result;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dateStr = selectedDate.toISOString().split("T")[0];
  const todayStr = today.toISOString().split("T")[0];

  const roomBookings = useMemo(
    () => getBookingsForRoom(room.id, dateStr),
    [room.id, dateStr],
  );

  // For each selectable slot index, determine if the 30-min block is available
  const slotAvailable = useMemo(() => {
    const available: boolean[] = [];
    const now = new Date();
    for (let i = 0; i < selectableSlots.length; i++) {
      const slotStart = selectableSlots[i];
      const slotEnd = TIME_SLOTS[i + 1];

      // Check if past for today
      if (dateStr === todayStr) {
        const [h, m] = slotStart.split(":").map(Number);
        if (
          h < now.getHours() ||
          (h === now.getHours() && m <= now.getMinutes())
        ) {
          available.push(false);
          continue;
        }
      }

      // Check overlap with existing bookings
      const isBooked = roomBookings.some(
        (b) => slotStart < b.endTime && slotEnd > b.startTime,
      );
      available.push(!isBooked);
    }
    return available;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomBookings, dateStr, todayStr]);

  const handleSlotClick = (idx: number) => {
    if (!slotAvailable[idx]) return;

    if (startSlotIdx === null || endSlotIdx !== null) {
      // Start a new selection
      setStartSlotIdx(idx);
      setEndSlotIdx(null);
    } else {
      if (idx <= startSlotIdx) {
        // Clicked before or on start -- restart
        setStartSlotIdx(idx);
        setEndSlotIdx(null);
      } else {
        // Check all blocks from startSlotIdx to idx (inclusive) are available
        let allAvailable = true;
        for (let i = startSlotIdx; i <= idx; i++) {
          if (!slotAvailable[i]) {
            allAvailable = false;
            break;
          }
        }
        if (allAvailable) {
          setEndSlotIdx(idx);
        } else {
          // Gap found -- restart from clicked slot
          setStartSlotIdx(idx);
          setEndSlotIdx(null);
        }
      }
    }
  };

  const isInRange = (idx: number) => {
    if (startSlotIdx === null) return false;
    if (endSlotIdx === null) return idx === startSlotIdx;
    return idx >= startSlotIdx && idx <= endSlotIdx;
  };

  // Derive actual start/end times from indices
  const startTime =
    startSlotIdx !== null ? selectableSlots[startSlotIdx] : null;
  // endTime = the selected slot's time (direct time, not the next block)
  const endTime =
    endSlotIdx !== null ? TIME_SLOTS[endSlotIdx] : null;

  const canContinue = startTime && endTime;

  const handleContinue = () => {
    if (startTime && endTime) {
      onSelect(dateStr, startTime, endTime);
    }
  };

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground">{room.name}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Pick a date and time range for your meeting.
        </p>
      </div>

      {/* Date row */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-foreground">Date</label>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {days.map((day) => {
            const dayStr = day.toISOString().split("T")[0];
            const isSelected = dayStr === dateStr;
            const isToday = dayStr === todayStr;
            return (
              <button
                key={dayStr}
                type="button"
                onClick={() => {
                  setSelectedDate(day);
                  setStartSlotIdx(null);
                  setEndSlotIdx(null);
                }}
                className={cn(
                  "flex flex-col items-center rounded-xl border px-4 py-3 min-w-[72px] transition-colors",
                  isSelected
                    ? "border-foreground bg-foreground text-background"
                    : "border-border bg-card text-foreground hover:border-foreground/30",
                )}
              >
                <span
                  className={cn(
                    "text-xs",
                    isSelected
                      ? "text-background/70"
                      : "text-muted-foreground",
                  )}
                >
                  {dayNames[day.getDay()]}
                </span>
                <span className="text-lg font-semibold">{day.getDate()}</span>
                <span
                  className={cn(
                    "text-xs",
                    isSelected
                      ? "text-background/70"
                      : "text-muted-foreground",
                  )}
                >
                  {monthNames[day.getMonth()]}
                </span>
                {isToday && (
                  <span
                    className={cn(
                      "mt-1 text-[10px] font-medium",
                      isSelected ? "text-background/80" : "text-accent",
                    )}
                  >
                    Today
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Time slots */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-foreground">
          Time slots
        </label>
        {startSlotIdx !== null && endSlotIdx === null && (
          <p className="text-xs text-muted-foreground">
            Tap another slot to set the end time.
          </p>
        )}
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {selectableSlots.map((slot, idx) => {
            const available = slotAvailable[idx];
            const inRange = isInRange(idx);
            const isStart = idx === startSlotIdx;

            return (
              <button
                key={slot}
                type="button"
                disabled={!available}
                onClick={() => handleSlotClick(idx)}
                className={cn(
                  "rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors",
                  !available &&
                    "cursor-not-allowed border-border bg-muted text-muted-foreground/40 line-through",
                  available &&
                    !inRange &&
                    "border-border bg-card text-foreground hover:border-foreground/30",
                  inRange &&
                    !isStart &&
                    "border-foreground/50 bg-foreground/10 text-foreground",
                  isStart &&
                    "border-foreground bg-foreground text-background",
                )}
              >
                {formatTime(slot)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selection summary */}
      {canContinue && (
        <div className="rounded-xl border border-accent/30 bg-accent/5 p-4">
          <p className="text-sm text-foreground">
            <span className="font-medium">{room.name}</span>
            {" on "}
            {selectedDate.toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
            })}
            {", "}
            {formatTime(startTime)} - {formatTime(endTime)}
          </p>
        </div>
      )}

      {/* Actions */}
      <Button
        onClick={handleContinue}
        disabled={!canContinue}
        className="w-full"
      >
        Continue
      </Button>
    </div>
  );
}
