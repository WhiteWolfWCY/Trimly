import { pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

export const userProfileTable = pgTable('user_profile', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull().unique(),
  first_name: text('first_name').notNull(),
  last_name: text('last_name').notNull(),
  email: text('email').notNull().unique(),
  phone_number: text('phone_number'),
  created_at: timestamp('created_at').notNull().defaultNow(),
  updated_at: timestamp('updated_at')
    .notNull()
    .$onUpdate(() => new Date()),
});
