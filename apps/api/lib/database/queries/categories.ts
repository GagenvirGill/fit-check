import { and, eq } from 'drizzle-orm';
import type {
  CategoryCreateResponse,
  CategoryUpdateResponse,
} from '@fit-check/shared/types/contracts/categories';
import * as schema from '@fit-check/database/schema';
import db from '../client';
import { DatabaseQueryError } from '../query-error';

const isUniqueViolation = (error: unknown): boolean =>
  typeof error === 'object' && error !== null && (error as { code?: unknown }).code === '23505';

const categoryNameExists = async (userId: string, name: string): Promise<boolean> => {
  const existing = await db
    .select({ categoryId: schema.category.categoryId })
    .from(schema.category)
    .where(and(eq(schema.category.userId, userId), eq(schema.category.name, name)))
    .limit(1);

  return Boolean(existing[0]);
};

const userOwnsItem = async (userId: string, itemId: string): Promise<boolean> => {
  const candidate = await db
    .select({ itemId: schema.item.itemId })
    .from(schema.item)
    .where(and(eq(schema.item.itemId, itemId), eq(schema.item.userId, userId)))
    .limit(1);

  return Boolean(candidate[0]);
};

export const createCategory = async (userId: string, rawName: string): Promise<CategoryCreateResponse> => {
  const name = rawName.trim();
  if (!name) {
    throw new DatabaseQueryError('Category name is required', 400);
  }

  if (await categoryNameExists(userId, name)) {
    throw new DatabaseQueryError('Category name already exists for this user', 409);
  }

  try {
    const created = await db
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

    return created[0];
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new DatabaseQueryError('Category name already exists for this user', 409);
    }
    throw new DatabaseQueryError('Failed to create category', 400);
  }
};

export const updateCategory = async (
  userId: string,
  categoryId: string,
  updates: { name?: string; favoriteItem?: string | null },
): Promise<CategoryUpdateResponse> => {
  const nextUpdates: { name?: string; favoriteItem?: string | null } = {};

  if (updates.name !== undefined) {
    const name = updates.name.trim();
    if (!name) {
      throw new DatabaseQueryError('Category name cannot be empty', 400);
    }
    nextUpdates.name = name;
  }

  if (updates.favoriteItem !== undefined) {
    nextUpdates.favoriteItem = updates.favoriteItem;
  }

  if (
    nextUpdates.favoriteItem !== undefined
    && nextUpdates.favoriteItem !== null
    && !(await userOwnsItem(userId, nextUpdates.favoriteItem))
  ) {
    throw new DatabaseQueryError('favoriteItem must reference an item owned by the user', 400);
  }

  if (Object.keys(nextUpdates).length === 0) {
    throw new DatabaseQueryError('No valid category updates provided', 400);
  }

  try {
    const updated = await db
      .update(schema.category)
      .set(nextUpdates)
      .where(and(eq(schema.category.categoryId, categoryId), eq(schema.category.userId, userId)))
      .returning({
        categoryId: schema.category.categoryId,
        name: schema.category.name,
        favoriteItem: schema.category.favoriteItem,
      });

    if (!updated[0]) {
      throw new DatabaseQueryError('Category not found', 404);
    }

    return updated[0];
  } catch (error) {
    if (error instanceof DatabaseQueryError) {
      throw error;
    }
    if (isUniqueViolation(error)) {
      throw new DatabaseQueryError('Category name already exists for this user', 409);
    }
    throw new DatabaseQueryError('Failed to update category', 400);
  }
};

export const deleteCategory = async (
  userId: string,
  categoryId: string,
): Promise<void> => {
  try {
    const deleted = await db
      .delete(schema.category)
      .where(and(eq(schema.category.categoryId, categoryId), eq(schema.category.userId, userId)))
      .returning({
        categoryId: schema.category.categoryId,
      });

    if (!deleted[0]) {
      throw new DatabaseQueryError('Category not found', 404);
    }
  } catch (error) {
    if (error instanceof DatabaseQueryError) {
      throw error;
    }
    throw new DatabaseQueryError('Failed to delete category', 400);
  }
};
