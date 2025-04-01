import { z } from "zod";

// Basic hairdresser types
export type Hairdresser = {
  id: number;
  first_name: string;
  last_name: string;
  phone_number: string | null;
  created_at: Date;
  updated_at: Date | null;
};

export type NewHairdresser = {
  first_name: string;
  last_name: string;
  phone_number?: string | null;
  created_at?: Date;
  updated_at?: Date | null;
};

// Hairdresser with availability and services
export interface HairdresserWithRelations {
  hairdresser: {
    first_name: string;
    last_name: string;
    phone_number?: string | null;
  };
  availability: {
    dayOfWeek: DayOfWeek;
    startTime: Date;
    endTime: Date;
  }[];
  services: number[]; // service IDs
}

// For updates with all fields optional
export interface HairdresserUpdateRelations {
  hairdresser?: {
    first_name?: string;
    last_name?: string;
    phone_number?: string | null;
  };
  availability?: {
    dayOfWeek: DayOfWeek;
    startTime: Date;
    endTime: Date;
  }[];
  services?: number[]; // service IDs
}

// Hairdresser details for UI
export interface HairdresserDetails extends Hairdresser {
  availability: HairdresserAvailability[];
  serviceIds: number[];
}

// Days of the week enum type
export type DayOfWeek = "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";

// Availability types
export type HairdresserAvailability = {
  id: number;
  hairdresserId: number;
  dayOfWeek: DayOfWeek;
  startTime: string | Date;
  endTime: string | Date;
  created_at?: Date;
  updated_at?: Date | null;
};

export type NewHairdresserAvailability = {
  hairdresserId: number;
  dayOfWeek: DayOfWeek;
  startTime: Date;
  endTime: Date;
  created_at?: Date;
  updated_at?: Date | null;
};

// Hairdresser service relation types
export type HairdresserService = {
  id: number;
  hairdresserId: number;
  serviceId: number;
  created_at: Date;
  updated_at: Date | null;
};

export type NewHairdresserService = {
  hairdresserId: number;
  serviceId: number;
  created_at?: Date;
  updated_at?: Date | null;
};

// Formatted data for API requests
export interface FormattedHairdresserData {
  hairdresser: {
    first_name: string;
    last_name: string;
    phone_number?: string;
  };
  availability: {
    dayOfWeek: DayOfWeek;
    startTime: Date;
    endTime: Date;
  }[];
  services: number[];
}

// Zod schemas
export const availabilitySchema = z.object({
  dayOfWeek: z.enum(["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format. Use HH:MM"),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format. Use HH:MM"),
}).refine(data => {
  const start = data.startTime.split(':').map(Number);
  const end = data.endTime.split(':').map(Number);
  const startMinutes = start[0] * 60 + start[1];
  const endMinutes = end[0] * 60 + end[1];
  return endMinutes > startMinutes;
}, {
  message: "End time must be after start time",
  path: ["endTime"]
});

export const hairdresserSchema = z.object({
  hairdresser: z.object({
    first_name: z.string().min(1, "First name is required"),
    last_name: z.string().min(1, "Last name is required"),
    phone_number: z.string().optional(),
  }),
  availability: z.array(availabilitySchema)
    .min(1, "At least one availability slot is required"),
  services: z.array(z.number())
    .min(1, "At least one service must be selected"),
});

export type HairdresserFormValues = z.infer<typeof hairdresserSchema>; 