import { relations } from "drizzle-orm";
import { integer, pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

import { itemToCategory } from "./item-to-category";
import { user } from "./user";

export const item = pgTable("items", {
  itemId: uuid("item_id").defaultRandom().primaryKey(),
  imagePath: varchar("image_path", { length: 255 }).notNull(),
  imageWidth: integer("image_width").notNull(),
  imageHeight: integer("image_height").notNull(),
  userId: uuid("user_id").notNull().references(() => user.userId, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const itemRelations = relations(item, ({ one, many }) => ({
  user: one(user, { fields: [item.userId], references: [user.userId] }),
  itemToCategories: many(itemToCategory),
}));
