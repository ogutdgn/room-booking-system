"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface StepIndicatorProps {
  steps: string[];
  currentStep: number;
}

export function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  const currentLabel = steps[currentStep - 1] ?? "";

  return (
    <>
      {/* Small screens (<1100px): compact version */}
      <div className="flex nav-lg:hidden items-center">
        <span className="text-sm font-medium text-foreground">
          {currentStep}{" "}
          <span className="text-muted-foreground font-normal">/</span>{" "}
          <span className="text-muted-foreground font-normal text-xs">
            {steps.length}
          </span>
          <span className="ml-2 font-medium">{currentLabel}</span>
        </span>
      </div>

      {/* Large screens (1100px+): full stepper with all steps */}
      <nav
        aria-label="Booking progress"
        className="hidden nav-lg:flex items-center gap-2"
      >
        {steps.map((label, index) => {
          const stepNum = index + 1;
          const isCompleted = stepNum < currentStep;
          const isCurrent = stepNum === currentStep;
          return (
            <div key={label} className="flex items-center gap-2">
              {index > 0 && (
                <div
                  className={cn(
                    "h-px w-6 lg:w-10",
                    isCompleted ? "bg-foreground" : "bg-border",
                  )}
                />
              )}
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium transition-colors",
                    isCompleted && "bg-foreground text-background",
                    isCurrent && "bg-foreground text-background",
                    !isCompleted &&
                      !isCurrent &&
                      "bg-secondary text-muted-foreground",
                  )}
                  aria-current={isCurrent ? "step" : undefined}
                >
                  {isCompleted ? <Check className="h-3.5 w-3.5" /> : stepNum}
                </div>
                <span
                  className={cn(
                    "text-sm",
                    isCurrent
                      ? "font-medium text-foreground"
                      : "text-muted-foreground",
                  )}
                >
                  {label}
                </span>
              </div>
            </div>
          );
        })}
      </nav>
    </>
  );
}
