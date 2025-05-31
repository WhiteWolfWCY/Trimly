import { numeric, pgTable, serial, text, timestamp, pgEnum } from 'drizzle-orm/pg-core';

export const userRoleEnum = pgEnum('user_role', ['admin', 'user']);

export const bookingStatusEnum = pgEnum('booking_status', [
  'booked',
  'cancelled',
  'past'
]);

export const dayOfWeekEnum = pgEnum('day_of_week', [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday'
]);

export const userProfileTable = pgTable('user_profile', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull().unique(),
  first_name: text('first_name').notNull(),
  last_name: text('last_name').notNull(),
  email: text('email').notNull().unique(),
  phone_number: text('phone_number'),
  role: userRoleEnum('role').notNull().default('user'),
  created_at: timestamp('created_at').notNull().defaultNow(),
  updated_at: timestamp('updated_at')
    .notNull()
    .$onUpdate(() => new Date()),
});

export const hairdressersTable = pgTable('hairdressers', {
  id: serial('id').primaryKey(),
  first_name: text('first_name').notNull(),
  last_name: text('last_name').notNull(),
  phone_number: text('phone_number'),
  created_at: timestamp('created_at').notNull().defaultNow(),
  updated_at: timestamp('updated_at')
});

export const servicesTable = pgTable('services', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  price: numeric('price').notNull(),
  time_required: numeric('time_required').notNull(),
  created_at: timestamp('created_at').notNull().defaultNow(),
  updated_at: timestamp('updated_at')
});

export const hairdressersServices = pgTable('hairdressers_services', {
  id: serial('id').primaryKey(),
  hairdresserId: serial('hairdresser_id').notNull().references(() => hairdressersTable.id),
  serviceId: serial('service_id').notNull().references(() => servicesTable.id),
  created_at: timestamp('created_at').notNull().defaultNow(),
  updated_at: timestamp('updated_at')
    .notNull()
    .$onUpdate(() => new Date()),
});

export const hairdresserAvailabilityTable = pgTable('hairdresser_availability', {
  id: serial('id').primaryKey(),
  hairdresserId: serial('hairdresser_id').notNull().references(() => hairdressersTable.id),
  dayOfWeek: dayOfWeekEnum('day_of_week').notNull(),
  startTime: timestamp('start_time').notNull(),
  endTime: timestamp('end_time').notNull(),
  created_at: timestamp('created_at').notNull().defaultNow(),
  updated_at: timestamp('updated_at')
    .notNull()
    .$onUpdate(() => new Date()),
});

export const bookingsTable = pgTable('bookings', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull().references(() => userProfileTable.userId),
  hairdresserId: serial('hairdresser_id').notNull().references(() => hairdressersTable.id),
  serviceId: serial('service_id').notNull().references(() => servicesTable.id),
  appointmentDate: timestamp('appointment_date').notNull(),
  status: bookingStatusEnum('status').notNull().default('booked'),
  notes: text('notes'),
  cancellationReason: text('cancellation_reason'),
  googleCalendarEventId: text('google_calendar_event_id'),
  created_at: timestamp('created_at').notNull().defaultNow(),
  updated_at: timestamp('updated_at')
    .notNull()
    .$onUpdate(() => new Date()),
});

export const googleCalendarCredentialsTable = pgTable('google_calendar_credentials', {
  id: serial('id').primaryKey(),
  access_token: text('access_token').notNull(),
  refresh_token: text('refresh_token').notNull(),
  scope: text('scope').notNull(),
  token_type: text('token_type').notNull(),
  expiry_date: timestamp('expiry_date').notNull(),
  created_at: timestamp('created_at').notNull().defaultNow(),
  updated_at: timestamp('updated_at')
    .notNull()
    .$onUpdate(() => new Date()),
});