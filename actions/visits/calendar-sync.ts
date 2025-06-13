'use server';

import { db } from "@/db/drizzle";
import { bookingsTable, hairdressersTable, servicesTable, userProfileTable } from "@/db/schema";
import { eq } from "drizzle-orm";
import { addMinutes } from "date-fns";
import { 
  createCalendarEvent, 
  updateCalendarEvent, 
  deleteCalendarEvent,
  CalendarEvent
} from "@/lib/google-calendar";
import { loadGoogleCalendarCredentials } from "../admin/google-calendar";

async function prepareCalendarEvent(bookingId: number): Promise<{ event: CalendarEvent, booking: any }> {
  const [booking] = await db
    .select({
      id: bookingsTable.id,
      userId: bookingsTable.userId,
      hairdresserId: bookingsTable.hairdresserId,
      serviceId: bookingsTable.serviceId,
      appointmentDate: bookingsTable.appointmentDate,
      status: bookingsTable.status,
      notes: bookingsTable.notes,
      googleCalendarEventId: bookingsTable.googleCalendarEventId,
    })
    .from(bookingsTable)
    .where(eq(bookingsTable.id, bookingId))
    .limit(1);

  if (!booking) {
    throw new Error("Booking not found");
  }

  const [hairdresser] = await db
    .select({
      id: hairdressersTable.id,
      first_name: hairdressersTable.first_name,
      last_name: hairdressersTable.last_name,
      phone_number: hairdressersTable.phone_number,
    })
    .from(hairdressersTable)
    .where(eq(hairdressersTable.id, booking.hairdresserId))
    .limit(1);

  const [service] = await db
    .select({
      id: servicesTable.id,
      name: servicesTable.name,
      description: servicesTable.description,
      price: servicesTable.price,
      time_required: servicesTable.time_required,
    })
    .from(servicesTable)
    .where(eq(servicesTable.id, booking.serviceId))
    .limit(1);

  const [user] = await db
    .select({
      userId: userProfileTable.userId,
      first_name: userProfileTable.first_name,
      last_name: userProfileTable.last_name,
      email: userProfileTable.email,
      phone_number: userProfileTable.phone_number,
    })
    .from(userProfileTable)
    .where(eq(userProfileTable.userId, booking.userId))
    .limit(1);

  if (!hairdresser || !service || !user) {
    throw new Error("Could not fetch booking details");
  }

  const serviceDuration = parseInt(service.time_required.toString(), 10);
  const endTime = addMinutes(booking.appointmentDate, serviceDuration);

  // Build comprehensive description in Polish
  const descriptionParts = [
    `📋 SZCZEGÓŁY REZERWACJI`,
    `ID Rezerwacji: #${booking.id}`,
    `Status: ${booking.status.toUpperCase()}`,
    ``,
    `💇 INFORMACJE O USŁUDZE`,
    `Usługa: ${service.name}`,
    `Czas trwania: ${serviceDuration} minut`,
    `Cena: ${service.price} zł`,
    ...(service.description ? [`Opis: ${service.description}`] : []),
    ``,
    `👤 DANE KLIENTA`,
    `Imię i nazwisko: ${user.first_name} ${user.last_name}`,
    `Email: ${user.email}`,
    ...(user.phone_number ? [`Telefon: ${user.phone_number}`] : []),
    ``,
    `✂️ DANE FRYZJERA`,
    `Imię i nazwisko: ${hairdresser.first_name} ${hairdresser.last_name}`,
    ...(hairdresser.phone_number ? [`Telefon: ${hairdresser.phone_number}`] : []),
    ``,
    ...(booking.notes ? [
      `📝 NOTATKI`,
      booking.notes,
      ``
    ] : []),
    `🕐 CZAS WIZYTY`,
    `Początek: ${booking.appointmentDate.toLocaleString('pl-PL', { 
      timeZone: 'Europe/Warsaw',
      dateStyle: 'full',
      timeStyle: 'short'
    })}`,
    `Koniec: ${endTime.toLocaleString('pl-PL', { 
      timeZone: 'Europe/Warsaw',
      dateStyle: 'full',
      timeStyle: 'short'
    })}`,
    `Strefa czasowa: Europe/Warsaw`
  ];

  const event: CalendarEvent = {
    summary: `${service.name} - ${user.first_name} ${user.last_name}`,
    description: descriptionParts.join('\n'),
    start: {
      dateTime: booking.appointmentDate.toISOString(),
      timeZone: 'Europe/Warsaw', 
    },
    end: {
      dateTime: endTime.toISOString(),
      timeZone: 'Europe/Warsaw',
    },
    attendees: [
      { email: user.email }
    ]
  };

  return { event, booking };
}

export async function addBookingToCalendar(bookingId: number) {
  try {
    const credentials = await loadGoogleCalendarCredentials();
    
    if (!credentials) {
      console.log("Google Calendar not connected");
      return null;
    }

    const { event, booking } = await prepareCalendarEvent(bookingId);
    
    if (booking.googleCalendarEventId) {
      return booking.googleCalendarEventId;
    }
    
    const calendarEvent = await createCalendarEvent(event);
    
    await db
      .update(bookingsTable)
      .set({ googleCalendarEventId: calendarEvent.id })
      .where(eq(bookingsTable.id, bookingId));
    
    return calendarEvent.id;
  } catch (error) {
    console.error("Error adding booking to calendar:", error);
    return null;
  }
}

export async function updateBookingInCalendar(bookingId: number) {
  try {
    const credentials = await loadGoogleCalendarCredentials();
    
    if (!credentials) {
      console.log("Google Calendar not connected");
      return null;
    }

    const { event, booking } = await prepareCalendarEvent(bookingId);
    
    if (!booking.googleCalendarEventId) {
      return await addBookingToCalendar(bookingId);
    }
    
    const calendarEvent = await updateCalendarEvent(booking.googleCalendarEventId, event);
    
    return calendarEvent.id;
  } catch (error) {
    console.error("Error updating booking in calendar:", error);
    return null;
  }
}

export async function removeBookingFromCalendar(bookingId: number) {
  try {
    const credentials = await loadGoogleCalendarCredentials();
    
    if (!credentials) {
      console.log("Google Calendar not connected");
      return false;
    }

    const [booking] = await db
      .select({ googleCalendarEventId: bookingsTable.googleCalendarEventId })
      .from(bookingsTable)
      .where(eq(bookingsTable.id, bookingId))
      .limit(1);
    
    if (!booking || !booking.googleCalendarEventId) {
      return false;
    }
    
    await deleteCalendarEvent(booking.googleCalendarEventId);
    
    await db
      .update(bookingsTable)
      .set({ googleCalendarEventId: null })
      .where(eq(bookingsTable.id, bookingId));
    
    return true;
  } catch (error) {
    console.error("Error removing booking from calendar:", error);
    return false;
  }
} 