import { and, eq } from 'drizzle-orm';
import type {
  CategoryCreateResponse,
  CategoryUpdateResponse,
} from '@fit-check/shared/types/contracts/categories';
import * as schema from '@fit-check/database/schema';
import db from '../client';

export const createCategory = async (userId: string, name: string): Promise<CategoryCreateResponse[]> =>
  db
    .insert(schema.category)
    .values({
      userId,
      name,
    })
    .returning({
      categoryId: schema.category.categoryId,
      name: schema.category.name,
      favoriteItem: schema.category.favoriteItem,
    });

export const categoryNameExists = async (userId: string, name: string): Promise<boolean> => {
  const existing = await db
    .select({ categoryId: schema.category.categoryId })
    .from(schema.category)
    .where(and(eq(schema.category.userId, userId), eq(schema.category.name, name)))
    .limit(1);

  return Boolean(existing[0]);
};

export const updateCategory = async (
  userId: string,
  categoryId: string,
  updates: { name?: string; favoriteItem?: string | null },
): Promise<CategoryUpdateResponse[]> =>
  db
    .update(schema.category)
    .set(updates)
    .where(and(eq(schema.category.categoryId, categoryId), eq(schema.category.userId, userId)))
    .returning({
      categoryId: schema.category.categoryId,
      name: schema.category.name,
      favoriteItem: schema.category.favoriteItem,
    });

export const deleteCategory = async (
  userId: string,
  categoryId: string,
): Promise<Array<{ categoryId: string }>> =>
  db
    .delete(schema.category)
    .where(and(eq(schema.category.categoryId, categoryId), eq(schema.category.userId, userId)))
    .returning({
      categoryId: schema.category.categoryId,
    });

export const userOwnsItem = async (userId: string, itemId: string): Promise<boolean> => {
  const candidate = await db
    .select({ itemId: schema.item.itemId })
    .from(schema.item)
    .where(and(eq(schema.item.itemId, itemId), eq(schema.item.userId, userId)))
    .limit(1);

  return Boolean(candidate[0]);
};
