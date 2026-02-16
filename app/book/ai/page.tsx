"use client";

import React from "react"

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ROOMS,
  type Room,
  formatTime,
  isSlotAvailable,
  addBooking,
  TIME_SLOTS,
  getRoomById,
} from "@/lib/booking-data";
import { SuccessScreen } from "@/components/booking/success-screen";

// --- Chat message types ---
interface ChatMessage {
  id: string;
  role: "assistant" | "user";
  content: string;
  roomCards?: RoomSuggestion[];
}

interface RoomSuggestion {
  room: Room;
  date: string;
  startTime: string;
  endTime: string;
}

// --- Simple intent parser for demo ---
type BookingIntent = {
  peopleCount?: number;
  date?: string;
  startTime?: string;
  endTime?: string;
  roomId?: string;
  fullName?: string;
  email?: string;
};

function parseIntent(text: string): Partial<BookingIntent> {
  const result: Partial<BookingIntent> = {};
  const lower = text.toLowerCase();

  // People count
  const peopleMatch = lower.match(/(\d+)\s*(people|person|attendee|seat|pax)/);
  if (peopleMatch) result.peopleCount = parseInt(peopleMatch[1]);
  // Also try "for X"
  const forMatch = lower.match(/for\s+(\d+)/);
  if (!result.peopleCount && forMatch) result.peopleCount = parseInt(forMatch[1]);

  // Date
  if (lower.includes("today")) {
    result.date = new Date().toISOString().split("T")[0];
  } else if (lower.includes("tomorrow")) {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    result.date = d.toISOString().split("T")[0];
  }

  // Time ranges like "3-4pm", "3pm to 4pm", "15:00-16:00"
  const timeRangeMatch = lower.match(
    /(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\s*[-–to]+\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/
  );
  if (timeRangeMatch) {
    let startH = parseInt(timeRangeMatch[1]);
    const startM = timeRangeMatch[2] ? parseInt(timeRangeMatch[2]) : 0;
    const startAmPm = timeRangeMatch[3];
    let endH = parseInt(timeRangeMatch[4]);
    const endM = timeRangeMatch[5] ? parseInt(timeRangeMatch[5]) : 0;
    const endAmPm = timeRangeMatch[6] || timeRangeMatch[3]; // inherit if only end has am/pm

    if (endAmPm === "pm" && endH < 12) endH += 12;
    if (startAmPm === "pm" && startH < 12) startH += 12;
    if (startAmPm === "am" && startH === 12) startH = 0;
    if (endAmPm === "am" && endH === 12) endH = 0;

    // If start looks small and end is pm, and start has no am/pm marker, assume pm
    if (!startAmPm && endAmPm === "pm" && startH < 12 && startH < endH - 12) {
      // e.g. "3-4pm" -> 3pm to 4pm
      startH += 12;
    }
    if (!startAmPm && !endAmPm && startH < endH) {
      // Assume PM for afternoon hours
      if (startH >= 1 && startH <= 6) {
        startH += 12;
        endH += 12;
      }
    }

    result.startTime = `${startH.toString().padStart(2, "0")}:${startM.toString().padStart(2, "0")}`;
    result.endTime = `${endH.toString().padStart(2, "0")}:${endM.toString().padStart(2, "0")}`;
  }

  // Email
  const emailMatch = text.match(/[\w.-]+@[\w.-]+\.\w+/);
  if (emailMatch) result.email = emailMatch[0];

  return result;
}

function findAvailableRooms(
  peopleCount: number,
  date: string,
  startTime: string,
  endTime: string
): RoomSuggestion[] {
  return ROOMS.filter(
    (room) =>
      room.capacityMax >= peopleCount &&
      room.capacityMin <= peopleCount + 2 &&
      isSlotAvailable(room.id, date, startTime, endTime)
  ).map((room) => ({ room, date, startTime, endTime }));
}

// --- Chat flow states ---
type FlowState =
  | "greeting"
  | "need_details"
  | "showing_options"
  | "need_name"
  | "need_email"
  | "confirming"
  | "done";

export default function AIBookingPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      role: "assistant",
      content:
        "Hi! I can help you find and book a meeting room. Just tell me what you need - for example: \"I need a room for 6 people today from 3-4pm\".",
    },
  ]);
  const [input, setInput] = useState("");
  const [flowState, setFlowState] = useState<FlowState>("greeting");
  const [collected, setCollected] = useState<BookingIntent>({});
  const [selectedSuggestion, setSelectedSuggestion] =
    useState<RoomSuggestion | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const addMessage = useCallback(
    (role: "assistant" | "user", content: string, roomCards?: RoomSuggestion[]) => {
      setMessages((prev) => [
        ...prev,
        { id: Date.now().toString() + Math.random(), role, content, roomCards },
      ]);
    },
    []
  );

  const processUserMessage = useCallback(
    (text: string) => {
      const intent = parseIntent(text);
      const merged = { ...collected, ...intent };

      // If user gives a name (no @, no numbers, 2+ words)
      if (
        flowState === "need_name" &&
        !intent.email &&
        text.trim().split(/\s+/).length >= 2
      ) {
        merged.fullName = text.trim();
      }

      // If user provides just an email
      if (flowState === "need_email" && intent.email) {
        merged.email = intent.email;
      }

      setCollected(merged);

      // Determine what we still need
      if (!merged.peopleCount && !merged.date && !merged.startTime) {
        addMessage(
          "assistant",
          "I'd be happy to help! Could you tell me:\n- How many people?\n- What date? (today, tomorrow)\n- What time range?"
        );
        setFlowState("need_details");
        return;
      }

      if (!merged.peopleCount) {
        addMessage("assistant", "How many people will be attending the meeting?");
        setFlowState("need_details");
        return;
      }

      if (!merged.date) {
        addMessage(
          "assistant",
          "What date would you like? You can say \"today\" or \"tomorrow\"."
        );
        setFlowState("need_details");
        return;
      }

      if (!merged.startTime || !merged.endTime) {
        addMessage(
          "assistant",
          "What time range works? For example, \"2-3pm\" or \"10am to 11:30am\"."
        );
        setFlowState("need_details");
        return;
      }

      // We have enough to search
      if (flowState !== "need_name" && flowState !== "need_email" && flowState !== "confirming") {
        const suggestions = findAvailableRooms(
          merged.peopleCount,
          merged.date,
          merged.startTime,
          merged.endTime
        );

        if (suggestions.length === 0) {
          addMessage(
            "assistant",
            "I couldn't find any available rooms matching your criteria. Try a different time, date, or adjust the number of people."
          );
          setFlowState("need_details");
          return;
        }

        addMessage(
          "assistant",
          `I found ${suggestions.length} room${suggestions.length > 1 ? "s" : ""} available for ${merged.peopleCount} people on ${new Date(merged.date + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })} from ${formatTime(merged.startTime)} to ${formatTime(merged.endTime)}:`,
          suggestions
        );
        setFlowState("showing_options");
        return;
      }

      if (flowState === "need_name") {
        if (merged.fullName) {
          addMessage("assistant", `Great, ${merged.fullName}! What's your email address?`);
          setFlowState("need_email");
        } else {
          addMessage("assistant", "Please provide your full name (first and last).");
        }
        return;
      }

      if (flowState === "need_email") {
        if (merged.email) {
          setFlowState("confirming");
          const room = getRoomById(merged.roomId || "");
          const displayDate = new Date(
            merged.date + "T00:00:00"
          ).toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
          });
          addMessage(
            "assistant",
            `Here's your booking summary:\n\n- Room: ${room?.name}\n- Date: ${displayDate}\n- Time: ${formatTime(merged.startTime!)} - ${formatTime(merged.endTime!)}\n- People: ${merged.peopleCount}\n- Name: ${merged.fullName}\n- Email: ${merged.email}\n\nShall I confirm this reservation? (yes/no)`
          );
        } else {
          addMessage("assistant", "Please provide a valid email address.");
        }
        return;
      }

      if (flowState === "confirming") {
        const lower = text.toLowerCase().trim();
        if (lower === "yes" || lower === "y" || lower === "confirm") {
          const result = addBooking({
            roomId: merged.roomId!,
            date: merged.date!,
            startTime: merged.startTime!,
            endTime: merged.endTime!,
            fullName: merged.fullName!,
            email: merged.email!,
            peopleCount: merged.peopleCount!,
          });
          if (result.success) {
            setFlowState("done");
          } else {
            addMessage(
              "assistant",
              result.error || "Something went wrong. Please try again."
            );
            setFlowState("need_details");
          }
        } else {
          addMessage(
            "assistant",
            "No problem! What would you like to change? You can start over by telling me your requirements."
          );
          setFlowState("greeting");
          setCollected({});
          setSelectedSuggestion(null);
        }
        return;
      }
    },
    [collected, flowState, addMessage]
  );

  const handleBookRoom = useCallback(
    (suggestion: RoomSuggestion) => {
      setSelectedSuggestion(suggestion);
      const newCollected = {
        ...collected,
        roomId: suggestion.room.id,
        date: suggestion.date,
        startTime: suggestion.startTime,
        endTime: suggestion.endTime,
      };
      setCollected(newCollected);

      addMessage(
        "user",
        `Book ${suggestion.room.name}`
      );
      addMessage(
        "assistant",
        `Great choice! ${suggestion.room.name} it is. What's your full name?`
      );
      setFlowState("need_name");
    },
    [collected, addMessage]
  );

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    addMessage("user", text);
    setInput("");

    // Process after a short delay for natural feel
    setTimeout(() => processUserMessage(text), 400);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isDone = flowState === "done";

  if (isDone && selectedSuggestion && collected.fullName) {
    return (
      <main className="min-h-screen flex items-start justify-center px-4 py-8">
        <div className="w-full max-w-lg">
          <SuccessScreen
            room={selectedSuggestion.room}
            date={collected.date!}
            startTime={collected.startTime!}
            endTime={collected.endTime!}
            fullName={collected.fullName!}
            peopleCount={collected.peopleCount!}
          />
        </div>
      </main>
    );
  }

  return (
    <main className="flex flex-col h-screen">
      {/* Header */}
      <header className="border-b border-border bg-card shrink-0">
        <div className="mx-auto flex max-w-lg items-center gap-4 px-4 py-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-base font-semibold text-foreground">
              AI Booking Assistant
            </h1>
            <p className="text-xs text-muted-foreground">
              Describe what you need
            </p>
          </div>
        </div>
      </header>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-lg px-4 py-6 flex flex-col gap-4">
          {messages.map((msg) => (
            <div key={msg.id}>
              <div
                className={
                  msg.role === "assistant"
                    ? "flex gap-3"
                    : "flex justify-end"
                }
              >
                {msg.role === "assistant" && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-foreground text-background text-xs font-bold mt-0.5">
                    AI
                  </div>
                )}
                <div
                  className={
                    msg.role === "assistant"
                      ? "rounded-2xl rounded-tl-md bg-card border border-border px-4 py-3 max-w-[85%]"
                      : "rounded-2xl rounded-tr-md bg-foreground text-background px-4 py-3 max-w-[85%]"
                  }
                >
                  <p className="text-sm leading-relaxed whitespace-pre-line">
                    {msg.content}
                  </p>
                </div>
              </div>

              {/* Room suggestion cards */}
              {msg.roomCards && msg.roomCards.length > 0 && (
                <div className="mt-3 ml-11 flex flex-col gap-2">
                  {msg.roomCards.map((suggestion) => (
                    <div
                      key={suggestion.room.id}
                      className="flex items-center justify-between rounded-xl border border-border bg-card p-4"
                    >
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-medium text-card-foreground">
                          {suggestion.room.name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {suggestion.room.capacityMin}-
                          {suggestion.room.capacityMax} people
                          {suggestion.room.tags.length > 0 &&
                            ` / ${suggestion.room.tags.join(", ")}`}
                        </span>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleBookRoom(suggestion)}
                      >
                        Book
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-border bg-card shrink-0">
        <div className="mx-auto flex max-w-lg items-center gap-3 px-4 py-4">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            className="flex-1"
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!input.trim()}
            aria-label="Send message"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </main>
  );
}
