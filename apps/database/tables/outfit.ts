import { date, jsonb, pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { user } from './user';

export type OutfitLayoutItem = {
  itemId: string;
  weight: number;
};

export type OutfitLayout = OutfitLayoutItem[][];

export const outfit = pgTable('outfits', {
  outfitId: uuid('outfit_id').defaultRandom().primaryKey(),
  dateWorn: date('date_worn').notNull(),
  description: varchar('description', { length: 511 }),
  layout: jsonb('layout').$type<OutfitLayout>().notNull(),
  userId: uuid('user_id').notNull().references(() => user.userId, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const outfitRelations = relations(outfit, ({ one }) => ({
  user: one(user, { fields: [outfit.userId], references: [user.userId] }),
}));
