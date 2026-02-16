"use client";

import React from "react"

import { useState } from "react";
import { type Room, formatTime } from "@/lib/booking-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ReservationFormProps {
  room: Room;
  date: string;
  startTime: string;
  endTime: string;
  onSubmit: (data: { fullName: string; email: string; peopleCount: number }) => void;
}

export function ReservationForm({
  room,
  date,
  startTime,
  endTime,
  onSubmit,
}: ReservationFormProps) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [peopleCount, setPeopleCount] = useState<number>(room.capacityMin);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!fullName.trim()) {
      newErrors.fullName = "Name is required.";
    }
    if (!email.trim()) {
      newErrors.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Enter a valid email address.";
    }
    if (!peopleCount || peopleCount < 1) {
      newErrors.peopleCount = "At least 1 person required.";
    } else if (peopleCount > room.capacityMax) {
      newErrors.peopleCount = `Maximum ${room.capacityMax} people for this room.`;
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit({ fullName: fullName.trim(), email: email.trim(), peopleCount });
    }
  };

  const displayDate = new Date(date + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Your details</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Fill in your information to complete the reservation.
        </p>
      </div>

      {/* Pre-filled summary */}
      <div className="rounded-xl border border-border bg-secondary/50 p-4 flex flex-col gap-1">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Room</span>
          <span className="font-medium text-foreground">{room.name}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Date</span>
          <span className="font-medium text-foreground">{displayDate}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Time</span>
          <span className="font-medium text-foreground">
            {formatTime(startTime)} - {formatTime(endTime)}
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="fullName">Full name</Label>
          <Input
            id="fullName"
            placeholder="Jane Doe"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className={errors.fullName ? "border-destructive" : ""}
          />
          {errors.fullName && (
            <p className="text-xs text-destructive">{errors.fullName}</p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="jane@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={errors.email ? "border-destructive" : ""}
          />
          {errors.email && (
            <p className="text-xs text-destructive">{errors.email}</p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="people">
            Number of people{" "}
            <span className="text-muted-foreground font-normal">
              (max {room.capacityMax})
            </span>
          </Label>
          <Input
            id="people"
            type="number"
            min={1}
            max={room.capacityMax}
            value={peopleCount}
            onChange={(e) => setPeopleCount(parseInt(e.target.value) || 0)}
            className={errors.peopleCount ? "border-destructive" : ""}
          />
          {errors.peopleCount && (
            <p className="text-xs text-destructive">{errors.peopleCount}</p>
          )}
        </div>

        <Button type="submit" className="w-full mt-2">
          Review booking
        </Button>
      </form>
    </div>
  );
}
