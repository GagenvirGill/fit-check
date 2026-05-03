import { pgTable, primaryKey, timestamp, uuid } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { item } from './item';
import { category } from './category';

export const itemToCategory = pgTable('item_to_category', {
  itemId: uuid('item_id').notNull().references(() => item.itemId, { onDelete: 'cascade' }),
  categoryId: uuid('category_id').notNull().references(() => category.categoryId, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  pk: primaryKey({ columns: [t.itemId, t.categoryId] }),
}));

export const itemToCategoryRelations = relations(itemToCategory, ({ one }) => ({
  item: one(item, { fields: [itemToCategory.itemId], references: [item.itemId] }),
  category: one(category, { fields: [itemToCategory.categoryId], references: [category.categoryId] }),
}));
