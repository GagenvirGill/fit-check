import { and, asc, eq } from 'drizzle-orm';
import * as schema from '@fit-check/database/schema';
import db from '../lib/database';

export const listCategories = async (userId: string) =>
  db
    .select({
      categoryId: schema.category.categoryId,
      name: schema.category.name,
      favoriteItem: schema.category.favoriteItem,
    })
    .from(schema.category)
    .where(eq(schema.category.userId, userId))
    .orderBy(asc(schema.category.name));

export const createCategory = async (userId: string, name: string) =>
  db
    .insert(schema.category)
    .values({
      userId,
      name,
    })
    .returning();

export const updateCategory = async (
  userId: string,
  categoryId: string,
  updates: { name?: string; favoriteItem?: string | null },
) =>
  db
    .update(schema.category)
    .set(updates)
    .where(and(eq(schema.category.categoryId, categoryId), eq(schema.category.userId, userId)))
    .returning({
      categoryId: schema.category.categoryId,
      name: schema.category.name,
      favoriteItem: schema.category.favoriteItem,
    });

export const deleteCategory = async (userId: string, categoryId: string) =>
  db
    .delete(schema.category)
    .where(and(eq(schema.category.categoryId, categoryId), eq(schema.category.userId, userId)))
    .returning({
      categoryId: schema.category.categoryId,
    });

export const userOwnsItem = async (userId: string, itemId: string) => {
  const candidate = await db
    .select({ itemId: schema.item.itemId })
    .from(schema.item)
    .where(and(eq(schema.item.itemId, itemId), eq(schema.item.userId, userId)))
    .limit(1);

  return Boolean(candidate[0]);
};
