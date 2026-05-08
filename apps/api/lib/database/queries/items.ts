import { and, eq, inArray } from 'drizzle-orm';
import type { CreateItemResponse } from '@fit-check/shared/types/contracts/items';
import type { OutfitLayoutModel } from '@fit-check/shared/types/models';
import * as schema from '@fit-check/database/schema';
import db from '../client';
import { DatabaseQueryError } from '../query-error';

export const createItemRecord = async (payload: {
  userId: string;
  imagePath: string;
  imageWidth: number;
  imageHeight: number;
}): Promise<CreateItemResponse> => {
  try {
    const inserted = await db
      .insert(schema.item)
      .values(payload)
      .returning({
        itemId: schema.item.itemId,
        imagePath: schema.item.imagePath,
        imageWidth: schema.item.imageWidth,
        imageHeight: schema.item.imageHeight,
        createdAt: schema.item.createdAt,
      });

    return inserted[0];
  } catch {
    throw new DatabaseQueryError('Failed to create item', 400);
  }
};

const findOwnedItem = async (
  userId: string,
  itemId: string,
): Promise<{ itemId: string; imagePath: string } | null> => {
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

const listUserOutfitLayouts = async (
  userId: string,
): Promise<Array<{ outfitId: string; layout: OutfitLayoutModel }>> =>
  db
    .select({
      outfitId: schema.outfit.outfitId,
      layout: schema.outfit.layout,
    })
    .from(schema.outfit)
    .where(eq(schema.outfit.userId, userId));

const allCategoriesBelongToUser = async (userId: string, categoryIds: string[]): Promise<boolean> => {
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

export const replaceOwnedItemCategories = async (
  userId: string,
  itemId: string,
  categoryIds: string[],
): Promise<void> => {
  try {
    const item = await findOwnedItem(userId, itemId);
    if (!item) {
      throw new DatabaseQueryError('Item not found', 404);
    }

    const validCategories = await allCategoriesBelongToUser(userId, categoryIds);
    if (!validCategories) {
      throw new DatabaseQueryError('One or more categories were not found for this user', 400);
    }

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
  } catch (error) {
    if (error instanceof DatabaseQueryError) {
      throw error;
    }
    throw new DatabaseQueryError('Failed to update item categories', 400);
  }
};

export const deleteOwnedItem = async (
  userId: string,
  itemId: string,
): Promise<{ imagePath: string }> => {
  try {
    const item = await findOwnedItem(userId, itemId);
    if (!item) {
      throw new DatabaseQueryError('Item not found', 404);
    }

    const outfits = await listUserOutfitLayouts(userId);
    const isReferenced = outfits.some((outfit) =>
      outfit.layout.some((row) => row.some((entry) => entry.itemId === itemId)),
    );

    if (isReferenced) {
      throw new DatabaseQueryError('Cannot delete item while it is referenced by one or more outfits', 409);
    }

    await db.delete(schema.item).where(and(eq(schema.item.itemId, itemId), eq(schema.item.userId, userId)));
    return { imagePath: item.imagePath };
  } catch (error) {
    if (error instanceof DatabaseQueryError) {
      throw error;
    }
    throw new DatabaseQueryError('Failed to delete item', 400);
  }
};
