"use client";

import { useState } from "react";
import { Users, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { ROOMS, type Room } from "@/lib/booking-data";
import { Badge } from "@/components/ui/badge";

const PEOPLE_FILTERS = [
  { label: "Any", min: 0, max: 100 },
  { label: "1-2", min: 1, max: 2 },
  { label: "3-4", min: 3, max: 4 },
  { label: "5-8", min: 5, max: 8 },
  { label: "9+", min: 9, max: 100 },
];

interface RoomSelectionProps {
  onSelect: (room: Room) => void;
}

export function RoomSelection({ onSelect }: RoomSelectionProps) {
  const [activeFilter, setActiveFilter] = useState(0);

  const filter = PEOPLE_FILTERS[activeFilter];
  const filteredRooms = ROOMS.filter((room) => {
    if (filter.min === 0) return true;
    return room.capacityMax >= filter.min && room.capacityMin <= filter.max;
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Select a room</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Choose the space that fits your meeting needs.
        </p>
      </div>

      {/* People count filter */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-foreground">
          How many people?
        </label>
        <div className="flex flex-wrap gap-2">
          {PEOPLE_FILTERS.map((pf, i) => (
            <button
              key={pf.label}
              type="button"
              onClick={() => setActiveFilter(i)}
              className={cn(
                "rounded-lg border px-4 py-2 text-sm font-medium transition-colors",
                activeFilter === i
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-card text-foreground hover:border-foreground/30"
              )}
            >
              {pf.label}
            </button>
          ))}
        </div>
      </div>

      {/* Room cards */}
      <div className="flex flex-col gap-3">
        {filteredRooms.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-8 text-center">
            <p className="text-sm text-muted-foreground">
              No rooms match this capacity. Try a different range.
            </p>
          </div>
        ) : (
          filteredRooms.map((room) => (
            <button
              key={room.id}
              type="button"
              onClick={() => onSelect(room)}
              className="group flex items-center gap-4 rounded-2xl border border-border bg-card p-5 text-left transition-all hover:border-foreground/20 hover:shadow-md"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-secondary">
                <Users className="h-5 w-5 text-secondary-foreground" />
              </div>
              <div className="flex flex-col gap-1 min-w-0 flex-1">
                <span className="text-base font-medium text-card-foreground">
                  {room.name}
                </span>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm text-muted-foreground">
                    {room.capacityMin}-{room.capacityMax} people
                  </span>
                  {room.tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="text-xs font-normal"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 transition-all group-hover:opacity-100" />
            </button>
          ))
        )}
      </div>
    </div>
  );
}
