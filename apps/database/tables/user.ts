import { pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { item } from './item';
import { category } from './category';
import { outfit } from './outfit';

export const user = pgTable('users', {
  userId: uuid('user_id').defaultRandom().primaryKey(),
  provider: varchar('provider', { length: 255 }).notNull(),
  providerId: varchar('provider_id', { length: 255 }).unique().notNull(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const userRelations = relations(user, ({ many }) => ({
  items: many(item),
  categories: many(category),
  outfits: many(outfit),
}));
