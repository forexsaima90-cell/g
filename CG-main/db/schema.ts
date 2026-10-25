import { pgEnum, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

export const userStatus = pgEnum('user_status', ['active', 'ended', 'revoked']);
export const users = pgTable('users', {
  username: text('username').primaryKey(),
  email: text('email'),
  licenseKey: text('license_key').notNull().unique(),
  deviceId: text('device_id').unique(),
  validFrom: timestamp('valid_from', { withTimezone: true, mode: 'date' }).notNull(),
  validTill: timestamp('valid_till', { withTimezone: true, mode: 'date' }).notNull(),
  status: userStatus('status').notNull().default('active')
});
