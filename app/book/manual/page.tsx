"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  type Room,
  type RecurrenceConfig,
  addBooking,
  addRecurringBookings,
  generateRecurringDates,
} from "@/lib/booking-data";
import { StepIndicator } from "@/components/booking/step-indicator";
import { RoomSelection } from "@/components/booking/room-selection";
import { AvailabilityPicker } from "@/components/booking/availability-picker";
import { RecurrencePicker } from "@/components/booking/recurrence-picker";
import { ReservationForm } from "@/components/booking/reservation-form";
import { ReviewConfirm } from "@/components/booking/review-confirm";
import { SuccessScreen } from "@/components/booking/success-screen";

const STEPS = ["Room", "Time", "Frequency", "Details", "Review"];

interface BookingState {
  room: Room | null;
  date: string;
  startTime: string;
  endTime: string;
  fullName: string;
  email: string;
  peopleCount: number;
  recurrence: RecurrenceConfig | null;
}

interface RecurringResult {
  bookedDates: string[];
  conflictDates: string[];
}

const INITIAL_STATE: BookingState = {
  room: null,
  date: "",
  startTime: "",
  endTime: "",
  fullName: "",
  email: "",
  peopleCount: 1,
  recurrence: null,
};

export default function ManualBookingPage() {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recurringResult, setRecurringResult] =
    useState<RecurringResult | null>(null);
  const [bookingState, setBookingState] =
    useState<BookingState>(INITIAL_STATE);

  // Track which room the availability picker was mounted for.
  // If the user goes back to step 1 and picks a different room
  // we remount the downstream components by changing the key.
  const [roomKey, setRoomKey] = useState(0);

  const handleRoomSelect = useCallback(
    (room: Room) => {
      // If a different room was chosen, bump the key so downstream steps remount
      if (bookingState.room && room.id !== bookingState.room.id) {
        setRoomKey((k) => k + 1);
        setBookingState((prev) => ({
          ...prev,
          room,
          date: "",
          startTime: "",
          endTime: "",
          recurrence: null,
        }));
      } else {
        setBookingState((prev) => ({ ...prev, room }));
      }
      setStep(2);
    },
    [bookingState.room],
  );

  const handleTimeSelect = useCallback(
    (date: string, startTime: string, endTime: string) => {
      setBookingState((prev) => ({ ...prev, date, startTime, endTime }));
      setStep(3);
    },
    [],
  );

  const handleRecurrenceSelect = useCallback(
    (config: RecurrenceConfig | null) => {
      setBookingState((prev) => ({ ...prev, recurrence: config }));
      setStep(4);
    },
    [],
  );

  const handleDetailsSubmit = useCallback(
    (data: { fullName: string; email: string; peopleCount: number }) => {
      setBookingState((prev) => ({ ...prev, ...data }));
      setStep(5);
    },
    [],
  );

  const handleConfirm = () => {
    if (!bookingState.room) return;
    setIsSubmitting(true);

    setTimeout(() => {
      const isRecurring =
        bookingState.recurrence && bookingState.recurrence.type !== "none";

      if (isRecurring && bookingState.recurrence) {
        const dates = generateRecurringDates(
          bookingState.date,
          bookingState.recurrence,
        );

        const result = addRecurringBookings(
          {
            roomId: bookingState.room!.id,
            startTime: bookingState.startTime,
            endTime: bookingState.endTime,
            fullName: bookingState.fullName,
            email: bookingState.email,
            peopleCount: bookingState.peopleCount,
          },
          dates,
        );

        setIsSubmitting(false);

        if (result.success) {
          setRecurringResult({
            bookedDates: result.bookedDates,
            conflictDates: result.conflictDates,
          });
          setStep(6);
        } else {
          toast.error(
            "All requested dates are already booked. Please try different times.",
          );
        }
      } else {
        const result = addBooking({
          roomId: bookingState.room!.id,
          date: bookingState.date,
          startTime: bookingState.startTime,
          endTime: bookingState.endTime,
          fullName: bookingState.fullName,
          email: bookingState.email,
          peopleCount: bookingState.peopleCount,
        });

        setIsSubmitting(false);

        if (result.success) {
          setStep(6);
        } else {
          toast.error(
            result.error || "Something went wrong. Please try again.",
          );
        }
      }
    }, 600);
  };

  const isSuccess = step === 6;

  return (
    <main className="min-h-screen flex flex-col">
      {/* Sticky header */}
      {!isSuccess && (
        <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
          <div className="relative flex items-center justify-between px-4 py-3">
            {/* Left: Home + Go Back */}
            <div className="flex items-center gap-1 shrink-0">
              <Button variant="ghost" size="sm" asChild>
                <Link
                  href="/"
                  className="flex items-center gap-1.5 text-muted-foreground"
                >
                  <Home className="h-4 w-4" />
                  <span className="hidden md:inline text-sm">Home</span>
                </Link>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={step === 1}
                onClick={() => setStep((s) => Math.max(1, s - 1))}
                className="flex items-center gap-1.5 text-muted-foreground"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden md:inline text-sm">Go back</span>
              </Button>
            </div>

            {/* Center: Step Indicator (large screens 1100px+) */}
            <div className="hidden nav-lg:block absolute left-1/2 -translate-x-1/2">
              <StepIndicator steps={STEPS} currentStep={step} />
            </div>

            {/* Right: Step Indicator (small screens <1100px) */}
            <div className="nav-lg:hidden">
              <StepIndicator steps={STEPS} currentStep={step} />
            </div>
          </div>
        </header>
      )}

      {/* Content — components stay mounted (hidden) so internal state is preserved */}
      <div className="flex-1 flex items-start justify-center px-4 py-8">
        <div className="w-full max-w-lg">
          {/* Step 1: Room */}
          <div className={step === 1 ? "" : "hidden"}>
            <RoomSelection onSelect={handleRoomSelect} />
          </div>

          {/* Step 2: Availability — keyed by room so it remounts if room changes */}
          {bookingState.room && (
            <div className={step === 2 ? "" : "hidden"}>
              <AvailabilityPicker
                key={`avail-${roomKey}`}
                room={bookingState.room}
                onSelect={handleTimeSelect}
              />
            </div>
          )}

          {/* Step 3: Recurrence — keyed by room so it remounts on room change */}
          <div className={step === 3 ? "" : "hidden"}>
            <RecurrencePicker
              key={`recur-${roomKey}`}
              onSelect={handleRecurrenceSelect}
            />
          </div>

          {/* Step 4: Details — keyed by room so it remounts on room change */}
          {bookingState.room && bookingState.date && (
            <div className={step === 4 ? "" : "hidden"}>
              <ReservationForm
                key={`form-${roomKey}`}
                room={bookingState.room}
                date={bookingState.date}
                startTime={bookingState.startTime}
                endTime={bookingState.endTime}
                onSubmit={handleDetailsSubmit}
              />
            </div>
          )}

          {/* Step 5: Review */}
          {step === 5 && bookingState.room && (
            <ReviewConfirm
              room={bookingState.room}
              date={bookingState.date}
              startTime={bookingState.startTime}
              endTime={bookingState.endTime}
              fullName={bookingState.fullName}
              email={bookingState.email}
              peopleCount={bookingState.peopleCount}
              recurrence={bookingState.recurrence}
              onConfirm={handleConfirm}
              isSubmitting={isSubmitting}
            />
          )}

          {/* Step 6: Success */}
          {step === 6 && bookingState.room && (
            <SuccessScreen
              room={bookingState.room}
              date={bookingState.date}
              startTime={bookingState.startTime}
              endTime={bookingState.endTime}
              fullName={bookingState.fullName}
              peopleCount={bookingState.peopleCount}
              recurrence={bookingState.recurrence}
              bookedDates={recurringResult?.bookedDates}
              conflictDates={recurringResult?.conflictDates}
            />
          )}
        </div>
      </div>
    </main>
  );
}
