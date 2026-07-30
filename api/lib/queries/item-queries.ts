import { and, eq, inArray } from "drizzle-orm";
import type { ItemResponse } from "#packages/contracts/item";
import { dbSchema } from "#packages/db/schema";
import { dbClient } from "../db-client";

export async function createItem(input: {
  userId: string;
  imagePath: string;
  imageWidth: number;
  imageHeight: number;
}): Promise<ItemResponse> {
  const [row] = await dbClient.insert(dbSchema.item).values(input).returning();

  return {
    itemId: row.itemId,
    imagePath: row.imagePath,
    imageWidth: row.imageWidth,
    imageHeight: row.imageHeight,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function updateItemCategories(input: {
  userId: string;
  itemId: string;
  categoryIds: string[];
}): Promise<boolean> {
  const hasItem = await hasUserItems(input.userId, [input.itemId]);
  if (!hasItem) {
    return false;
  }
  if (input.categoryIds.length > 0) {
    const hasCategories = await hasUserCategories(
      input.userId,
      input.categoryIds,
    );
    if (!hasCategories) {
      return false;
    }
  }

  await dbClient.transaction(async (tx) => {
    await tx
      .delete(dbSchema.itemToCategory)
      .where(eq(dbSchema.itemToCategory.itemId, input.itemId));

    if (input.categoryIds.length > 0) {
      await tx.insert(dbSchema.itemToCategory).values(
        input.categoryIds.map((categoryId) => ({
          itemId: input.itemId,
          categoryId,
        })),
      );
    }
  });

  return true;
}

export async function deleteItem(input: {
  userId: string;
  itemId: string;
}): Promise<void> {
  await dbClient
    .delete(dbSchema.item)
    .where(
      and(
        eq(dbSchema.item.userId, input.userId),
        eq(dbSchema.item.itemId, input.itemId),
      ),
    );
}

async function hasUserItems(
  userId: string,
  itemIds: string[],
): Promise<boolean> {
  const uniqueItemIds = [...new Set(itemIds)];
  const rows = await dbClient
    .select({ itemId: dbSchema.item.itemId })
    .from(dbSchema.item)
    .where(
      and(
        eq(dbSchema.item.userId, userId),
        inArray(dbSchema.item.itemId, uniqueItemIds),
      ),
    );

  return rows.length === uniqueItemIds.length;
}

async function hasUserCategories(
  userId: string,
  categoryIds: string[],
): Promise<boolean> {
  const uniqueCategoryIds = [...new Set(categoryIds)];
  const rows = await dbClient
    .select({ categoryId: dbSchema.category.categoryId })
    .from(dbSchema.category)
    .where(
      and(
        eq(dbSchema.category.userId, userId),
        inArray(dbSchema.category.categoryId, uniqueCategoryIds),
      ),
    );

  return rows.length === uniqueCategoryIds.length;
}
