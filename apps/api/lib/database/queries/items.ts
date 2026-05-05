import { and, eq, inArray } from 'drizzle-orm';
import * as schema from '@fit-check/database/schema';
import db from '../client';

export const createItemRecord = async (payload: {
  userId: string;
  imagePath: string;
  imageWidth: number;
  imageHeight: number;
}) => {
  const inserted = await db
    .insert(schema.item)
    .values(payload)
    .returning();

  return inserted[0];
};

export const findOwnedItem = async (userId: string, itemId: string) => {
  const found = await db
    .select({
      itemId: schema.item.itemId,
      imagePath: schema.item.imagePath,
    })
    .from(schema.item)
    .where(and(eq(schema.item.itemId, itemId), eq(schema.item.userId, userId)))
    .limit(1);

  return found[0] ?? null;
};

export const listUserOutfitLayouts = async (userId: string) =>
  db
    .select({
      outfitId: schema.outfit.outfitId,
      layout: schema.outfit.layout,
    })
    .from(schema.outfit)
    .where(eq(schema.outfit.userId, userId));

export const deleteOwnedItem = async (userId: string, itemId: string) =>
  db.delete(schema.item).where(and(eq(schema.item.itemId, itemId), eq(schema.item.userId, userId)));

export const itemExists = async (userId: string, itemId: string) => {
  const item = await db
    .select({
      itemId: schema.item.itemId,
    })
    .from(schema.item)
    .where(and(eq(schema.item.itemId, itemId), eq(schema.item.userId, userId)))
    .limit(1);

  return Boolean(item[0]);
};

export const allCategoriesBelongToUser = async (userId: string, categoryIds: string[]) => {
  if (categoryIds.length === 0) {
    return true;
  }

  const foundCategories = await db
    .select({
      categoryId: schema.category.categoryId,
    })
    .from(schema.category)
    .where(and(eq(schema.category.userId, userId), inArray(schema.category.categoryId, categoryIds)));

  return foundCategories.length === categoryIds.length;
};

export const replaceItemCategories = async (itemId: string, categoryIds: string[]) => {
  await db.transaction(async (tx) => {
    await tx.delete(schema.itemToCategory).where(eq(schema.itemToCategory.itemId, itemId));
    if (categoryIds.length > 0) {
      await tx.insert(schema.itemToCategory).values(
        categoryIds.map((categoryId) => ({
          itemId,
          categoryId,
        })),
      );
    }
  });
};
