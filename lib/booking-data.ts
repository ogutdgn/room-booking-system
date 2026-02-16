// Room and booking data types + mock data for the reservation system

export interface Room {
  id: string;
  name: string;
  capacityMin: number;
  capacityMax: number;
  tags: string[];
}

export type RecurrenceType = "none" | "daily" | "weekly" | "custom";

export interface RecurrenceConfig {
  type: RecurrenceType;
  // For "custom": which days of the week (0=Sun, 1=Mon, ... 6=Sat)
  customDays?: number[];
  // How many weeks to repeat (applies to all recurring types)
  repeatWeeks: number;
}

export interface Booking {
  id: string;
  roomId: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  fullName: string;
  email: string;
  peopleCount: number;
  recurrenceGroupId?: string; // links recurring bookings together
}

export const ROOMS: Room[] = [
  {
    id: "room-1",
    name: "Focus Pod",
    capacityMin: 1,
    capacityMax: 2,
    tags: ["Small", "Quiet"],
  },
  {
    id: "room-2",
    name: "Duo Room",
    capacityMin: 2,
    capacityMax: 3,
    tags: ["Small"],
  },
  {
    id: "room-3",
    name: "Collaboration Suite",
    capacityMin: 4,
    capacityMax: 6,
    tags: ["Medium", "Whiteboard"],
  },
  {
    id: "room-4",
    name: "Strategy Room",
    capacityMin: 5,
    capacityMax: 8,
    tags: ["Medium", "Screen"],
  },
  {
    id: "room-5",
    name: "Boardroom",
    capacityMin: 8,
    capacityMax: 12,
    tags: ["Large", "AV System"],
  },
  {
    id: "room-6",
    name: "Town Hall",
    capacityMin: 10,
    capacityMax: 20,
    tags: ["Large", "Stage"],
  },
];

// Time slots from 8:00 AM to 6:00 PM in 30-minute increments
export const TIME_SLOTS: string[] = [];
for (let h = 8; h <= 17; h++) {
  TIME_SLOTS.push(`${h.toString().padStart(2, "0")}:00`);
  TIME_SLOTS.push(`${h.toString().padStart(2, "0")}:30`);
}
TIME_SLOTS.push("18:00");

export function formatTime(time: string): string {
  const [h, m] = time.split(":");
  const hour = parseInt(h);
  const ampm = hour >= 12 ? "PM" : "AM";
  const h12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${h12}:${m} ${ampm}`;
}

// In-memory booking store (client-side only for demo)
let bookings: Booking[] = [
  {
    id: "b-1",
    roomId: "room-3",
    date: new Date().toISOString().split("T")[0],
    startTime: "09:00",
    endTime: "10:00",
    fullName: "Alice Johnson",
    email: "alice@company.com",
    peopleCount: 4,
  },
  {
    id: "b-2",
    roomId: "room-5",
    date: new Date().toISOString().split("T")[0],
    startTime: "14:00",
    endTime: "15:30",
    fullName: "Bob Smith",
    email: "bob@company.com",
    peopleCount: 10,
  },
];

export function getBookings(): Booking[] {
  return [...bookings];
}

export function getBookingsForRoom(roomId: string, date: string): Booking[] {
  return bookings.filter((b) => b.roomId === roomId && b.date === date);
}

export function isSlotAvailable(
  roomId: string,
  date: string,
  startTime: string,
  endTime: string,
): boolean {
  const roomBookings = getBookingsForRoom(roomId, date);
  return !roomBookings.some((b) => {
    return startTime < b.endTime && endTime > b.startTime;
  });
}

export function addBooking(
  booking: Omit<Booking, "id">,
): { success: boolean; booking?: Booking; error?: string } {
  if (
    !isSlotAvailable(
      booking.roomId,
      booking.date,
      booking.startTime,
      booking.endTime,
    )
  ) {
    return {
      success: false,
      error:
        "This time slot is no longer available. Please choose another time.",
    };
  }

  const room = ROOMS.find((r) => r.id === booking.roomId);
  if (room && booking.peopleCount > room.capacityMax) {
    return {
      success: false,
      error: `This room can hold a maximum of ${room.capacityMax} people.`,
    };
  }

  const newBooking: Booking = {
    ...booking,
    id: `b-${Date.now()}`,
  };
  bookings = [...bookings, newBooking];
  return { success: true, booking: newBooking };
}

/**
 * Generate all dates for a recurring booking pattern.
 * Returns an array of YYYY-MM-DD strings.
 */
export function generateRecurringDates(
  startDate: string,
  config: RecurrenceConfig,
): string[] {
  const dates: string[] = [];
  const start = new Date(startDate + "T00:00:00");
  const totalDays = config.repeatWeeks * 7;

  if (config.type === "daily") {
    for (let i = 0; i < totalDays; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      // Skip weekends
      const day = d.getDay();
      if (day !== 0 && day !== 6) {
        dates.push(d.toISOString().split("T")[0]);
      }
    }
  } else if (config.type === "weekly") {
    const dayOfWeek = start.getDay();
    for (let w = 0; w < config.repeatWeeks; w++) {
      const d = new Date(start);
      d.setDate(start.getDate() + w * 7);
      dates.push(d.toISOString().split("T")[0]);
    }
  } else if (config.type === "custom" && config.customDays?.length) {
    for (let i = 0; i < totalDays; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      if (config.customDays.includes(d.getDay())) {
        dates.push(d.toISOString().split("T")[0]);
      }
    }
  }

  return dates;
}

/**
 * Add multiple bookings for a recurring pattern.
 * Returns info about successful and conflicting dates.
 */
export function addRecurringBookings(
  baseBooking: Omit<Booking, "id" | "date" | "recurrenceGroupId">,
  dates: string[],
): {
  success: boolean;
  bookedDates: string[];
  conflictDates: string[];
  groupId: string;
} {
  const groupId = `rg-${Date.now()}`;
  const bookedDates: string[] = [];
  const conflictDates: string[] = [];

  for (const date of dates) {
    if (
      isSlotAvailable(
        baseBooking.roomId,
        date,
        baseBooking.startTime,
        baseBooking.endTime,
      )
    ) {
      const newBooking: Booking = {
        ...baseBooking,
        date,
        id: `b-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        recurrenceGroupId: groupId,
      };
      bookings = [...bookings, newBooking];
      bookedDates.push(date);
    } else {
      conflictDates.push(date);
    }
  }

  return {
    success: bookedDates.length > 0,
    bookedDates,
    conflictDates,
    groupId,
  };
}

export function getRoomById(id: string): Room | undefined {
  return ROOMS.find((r) => r.id === id);
}

export const DAY_NAMES_FULL = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
export const DAY_NAMES_SHORT = [
  "Sun",
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
];
