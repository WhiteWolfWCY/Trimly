"use server";

import { db } from "@/db/drizzle";
import {
  bookingsTable,
  hairdressersTable,
  servicesTable,
  hairdresserAvailabilityTable,
  hairdressersServices,
} from "@/db/schema";
import { eq, and, or, gte, lt, between, inArray, sql } from "drizzle-orm";
import { NewBooking, TimeSlot } from "@/types/booking";
import { Hairdresser } from "@/types/hairdresser";
import { Service } from "@/types/service";
import { auth } from "@clerk/nextjs/server";
import {
  format,
  addMinutes,
  startOfDay,
  endOfDay,
  isWithinInterval,
  parseISO,
} from "date-fns";
import { DayOfWeek } from "@/types/hairdresser";
import { revalidateTag } from 'next/cache';

const BOOKING_STATUS_BOOKED = "booked";

function getDayOfWeek(date: Date): DayOfWeek {
  const days: DayOfWeek[] = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
  ];
  const dayIndex = (date.getDay() + 6) % 7;
  return days[dayIndex];
}

type HairdresserWithServices = Hairdresser & {
  services: Service[];
  availability: Array<{
    id: number;
    hairdresserId: number;
    dayOfWeek: DayOfWeek;
    startTime: Date;
    endTime: Date;
    created_at: Date;
    updated_at: Date | null;
  }>;
};

export async function getHairdressersWithServices(): Promise<
  HairdresserWithServices[]
> {
  const hairdressers = await db.select().from(hairdressersTable);

  const result: HairdresserWithServices[] = [];

  for (const hairdresser of hairdressers) {
    const serviceRelations = await db
      .select()
      .from(hairdressersServices)
      .where(eq(hairdressersServices.hairdresserId, hairdresser.id))
      .leftJoin(
        servicesTable,
        eq(hairdressersServices.serviceId, servicesTable.id)
      );

    const availability = await db
      .select()
      .from(hairdresserAvailabilityTable)
      .where(eq(hairdresserAvailabilityTable.hairdresserId, hairdresser.id));

    const services = serviceRelations.map((relation) => relation.services);

    result.push({
      ...hairdresser,
      services: services as Service[],
      availability,
    });
  }

  return result;
}

export async function getAvailableTimeSlots(
  date: string,
  serviceId?: number
): Promise<TimeSlot[]> {
  const selectedDate = parseISO(date);
  const dayOfWeek = getDayOfWeek(selectedDate);

  const availabilityQuery = db
    .select({
      hairdresserId: hairdresserAvailabilityTable.hairdresserId,
      startTime: hairdresserAvailabilityTable.startTime,
      endTime: hairdresserAvailabilityTable.endTime,
    })
    .from(hairdresserAvailabilityTable)
    .where(eq(hairdresserAvailabilityTable.dayOfWeek, dayOfWeek));

  const hairdresserServiceIds = serviceId
    ? (
        await db
          .select({ hairdresserId: hairdressersServices.hairdresserId })
          .from(hairdressersServices)
          .where(eq(hairdressersServices.serviceId, serviceId))
      ).map((h) => h.hairdresserId)
    : [];

  let availabilities = await availabilityQuery;

  if (serviceId && hairdresserServiceIds.length > 0) {
    availabilities = availabilities.filter((avail) =>
      hairdresserServiceIds.includes(avail.hairdresserId)
    );
  }

  const service = serviceId
    ? await db
        .select()
        .from(servicesTable)
        .where(eq(servicesTable.id, serviceId))
        .limit(1)
    : null;

  const serviceDuration = service?.length
    ? parseInt(service[0].time_required.toString(), 10)
    : 30;

  const dayStart = startOfDay(selectedDate);
  const dayEnd = endOfDay(selectedDate);

  const existingBookings = await db
    .select({
      hairdresserId: bookingsTable.hairdresserId,
      appointmentDate: bookingsTable.appointmentDate,
      serviceId: bookingsTable.serviceId,
    })
    .from(bookingsTable)
    .where(
      and(
        between(bookingsTable.appointmentDate, dayStart, dayEnd),
        eq(bookingsTable.status, BOOKING_STATUS_BOOKED)
      )
    );

  const bookingServiceIds = existingBookings.map((b) => b.serviceId);
  const bookingServices =
    bookingServiceIds.length > 0
      ? await db
          .select()
          .from(servicesTable)
          .where(inArray(servicesTable.id, bookingServiceIds))
      : [];

  const serviceDurations = new Map();
  bookingServices.forEach((service) => {
    serviceDurations.set(
      service.id,
      parseInt(service.time_required.toString(), 10)
    );
  });

  const timeSlots: TimeSlot[] = [];
  const slotInterval = 30;

  availabilities.forEach((avail) => {
    const startTime = new Date(avail.startTime);
    const endTime = new Date(avail.endTime);

    const availStartTime = new Date(selectedDate);
    availStartTime.setHours(startTime.getHours(), startTime.getMinutes(), 0, 0);

    const availEndTime = new Date(selectedDate);
    availEndTime.setHours(endTime.getHours(), endTime.getMinutes(), 0, 0);

    let currentSlotStart = new Date(availStartTime);

    while (addMinutes(currentSlotStart, serviceDuration) <= availEndTime) {
      const slotEnd = addMinutes(currentSlotStart, serviceDuration);

      const isAvailable = !existingBookings.some((booking) => {
        const bookingTime = new Date(booking.appointmentDate);
        const bookingDuration = serviceDurations.get(booking.serviceId) || 30;
        const bookingEnd = addMinutes(bookingTime, bookingDuration);

        return (
          booking.hairdresserId === avail.hairdresserId &&
          currentSlotStart < bookingEnd &&
          slotEnd > bookingTime
        );
      });

      timeSlots.push({
        hairdresserId: avail.hairdresserId,
        serviceId: serviceId || 0,
        startTime: new Date(currentSlotStart),
        endTime: new Date(slotEnd),
        available: isAvailable,
      });

      currentSlotStart = addMinutes(currentSlotStart, slotInterval);
    }
  });

  return timeSlots;
}

export async function createBooking(data: NewBooking) {
  const { userId } = await auth();

  if (!userId || userId !== data.userId) {
    throw new Error("Unauthorized");
  }

  const serviceCheck = await db
    .select()
    .from(hairdressersServices)
    .where(
      and(
        eq(hairdressersServices.hairdresserId, data.hairdresserId),
        eq(hairdressersServices.serviceId, data.serviceId)
      )
    );

  if (serviceCheck.length === 0) {
    throw new Error("This hairdresser does not provide the selected service");
  }

  const service = await db
    .select()
    .from(servicesTable)
    .where(eq(servicesTable.id, data.serviceId))
    .limit(1);

  if (!service.length) {
    throw new Error("Service not found");
  }

  const serviceDuration = parseInt(service[0].time_required.toString(), 10);

  const conflictingBookings = await db
    .select()
    .from(bookingsTable)
    .where(
      and(
        eq(bookingsTable.hairdresserId, data.hairdresserId),
        eq(bookingsTable.status, BOOKING_STATUS_BOOKED)
      )
    );

  const actualConflicts = await Promise.all(
    conflictingBookings.map(async (booking) => {
      const bookingService = await db
        .select()
        .from(servicesTable)
        .where(eq(servicesTable.id, booking.serviceId))
        .limit(1);

      if (!bookingService.length) return false;

      const bookingDuration = parseInt(
        bookingService[0].time_required.toString(),
        10
      );
      const bookingTime = new Date(booking.appointmentDate);
      const bookingEndTime = addMinutes(bookingTime, bookingDuration);

      const newBookingTime = new Date(data.appointmentDate);
      const newBookingEndTime = addMinutes(newBookingTime, serviceDuration);

      return newBookingTime < bookingEndTime && newBookingEndTime > bookingTime;
    })
  );

  if (actualConflicts.some((conflict) => conflict)) {
    throw new Error("This time slot is no longer available");
  }

  const [booking] = await db
    .insert(bookingsTable)
    .values({
      userId: data.userId,
      hairdresserId: data.hairdresserId,
      serviceId: data.serviceId,
      appointmentDate: data.appointmentDate,
      notes: data.notes,
      status: BOOKING_STATUS_BOOKED,
      created_at: new Date(),
      updated_at: new Date(),
    })
    .returning();

  revalidateTag('visits');
  
  return booking;
}
