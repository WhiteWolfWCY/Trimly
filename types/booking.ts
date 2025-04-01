import { z } from "zod";
import { Service } from "./service";
import { Hairdresser, HairdresserAvailability } from "./hairdresser";
import { Visit } from "./visits";

export interface HairdresserWithServices extends Hairdresser {
  services: Service[];
  availability: HairdresserAvailability[];
}

export interface TimeSlot {
  hairdresserId: number;
  serviceId: number;
  startTime: Date;
  endTime: Date;
  available: boolean;
}

export interface NewBooking {
  userId: string;
  hairdresserId: number;
  serviceId: number;
  appointmentDate: Date;
  notes?: string;
}

export interface BookingConfirmation {
  booking: Visit;
  hairdresser: Hairdresser;
  service: Service;
}

export const bookingSchema = z.object({
  hairdresserId: z.number().positive("Please select a hairdresser"),
  serviceId: z.number().positive("Please select a service"),
  appointmentDate: z.date({
    required_error: "Please select an appointment date and time",
  }),
  notes: z.string().optional(),
});

export type BookingFormValues = z.infer<typeof bookingSchema>; 