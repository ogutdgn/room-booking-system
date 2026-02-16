"use client";

import Link from "next/link";
import { MessageSquare, CalendarDays, ArrowRight } from "lucide-react";

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-lg flex flex-col items-center gap-12">
        {/* Header */}
        <div className="text-center flex flex-col gap-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
            <CalendarDays className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground text-balance">
            Book a Meeting Room
          </h1>
          <p className="text-muted-foreground text-base leading-relaxed">
            Find and reserve the perfect space for your next meeting.
          </p>
        </div>

        {/* Two Booking Options */}
        <div className="w-full flex flex-col gap-4">
          {/* AI Booking Card */}
          <Link
            href="/book/ai"
            className="group relative flex items-start gap-5 rounded-2xl border border-border bg-card p-6 transition-all hover:border-foreground/20 hover:shadow-md"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent">
              <MessageSquare className="h-5 w-5 text-accent-foreground" />
            </div>
            <div className="flex flex-col gap-1.5 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-lg font-medium text-card-foreground">
                  Book with AI
                </span>
                <span className="inline-flex items-center rounded-full bg-accent/20 px-2.5 py-0.5 text-xs font-medium text-accent">
                  Recommended
                </span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Tell the assistant what you need. It will find a room and book
                it for you.
              </p>
            </div>
            <ArrowRight className="absolute right-6 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground opacity-0 transition-all group-hover:opacity-100 group-hover:translate-x-1" />
          </Link>

          {/* Manual Booking Card */}
          <Link
            href="/book/manual"
            className="group relative flex items-start gap-5 rounded-2xl border border-border bg-card p-6 transition-all hover:border-foreground/20 hover:shadow-md"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-secondary">
              <CalendarDays className="h-5 w-5 text-secondary-foreground" />
            </div>
            <div className="flex flex-col gap-1.5 min-w-0">
              <span className="text-lg font-medium text-card-foreground">
                Choose a room & time
              </span>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Browse rooms and see available times quickly.
              </p>
            </div>
            <ArrowRight className="absolute right-6 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground opacity-0 transition-all group-hover:opacity-100 group-hover:translate-x-1" />
          </Link>
        </div>

        {/* Footer hint */}
        <p className="text-xs text-muted-foreground text-center">
          All rooms are located in the main building.
        </p>
      </div>
    </main>
  );
}
