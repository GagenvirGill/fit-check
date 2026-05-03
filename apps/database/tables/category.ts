import { pgTable, timestamp, uniqueIndex, uuid, varchar } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { user } from './user';
import { item } from './item';
import { itemToCategory } from './item-to-category';

export const category = pgTable('categories', {
  categoryId: uuid('category_id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  favoriteItem: uuid('favorite_item').references(() => item.itemId),
  userId: uuid('user_id').references(() => user.userId, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  userCategoryNameUnique: uniqueIndex('categories_user_id_name_unique').on(t.userId, t.name),
}));

export const categoryRelations = relations(category, ({ one, many }) => ({
  user: one(user, { fields: [category.userId], references: [user.userId] }),
  favoriteItem: one(item, { fields: [category.favoriteItem], references: [item.itemId] }),
  itemToCategories: many(itemToCategory),
}));
