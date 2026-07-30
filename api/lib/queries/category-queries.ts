import { and, eq, inArray } from "drizzle-orm";

import type { CategoryResponse } from "#packages/contracts/category";
import { dbSchema } from "#packages/db/schema";
import { dbClient } from "../db-client";

export async function createCategory(input: {
  userId: string;
  name: string;
}): Promise<CategoryResponse> {
  const [row] = await dbClient
    .insert(dbSchema.category)
    .values(input)
    .returning();

  return toCategoryResponse(row);
}

export async function updateCategory(input: {
  userId: string;
  categoryId: string;
  name?: string;
  favoriteItem?: string | null;
  itemIds?: string[];
}): Promise<CategoryResponse | null> {
  if (input.favoriteItem) {
    const hasFavoriteItem = await hasUserItems(input.userId, [
      input.favoriteItem,
    ]);
    if (!hasFavoriteItem) {
      return null;
    }
  }
  if (input.itemIds && input.itemIds.length > 0) {
    const hasItems = await hasUserItems(input.userId, input.itemIds);
    if (!hasItems) {
      return null;
    }
  }

  await dbClient.transaction(async (tx) => {
    if (input.itemIds) {
      await tx
        .delete(dbSchema.itemToCategory)
        .where(eq(dbSchema.itemToCategory.categoryId, input.categoryId));
      if (input.itemIds.length > 0) {
        await tx.insert(dbSchema.itemToCategory).values(
          input.itemIds.map((itemId) => ({
            itemId,
            categoryId: input.categoryId,
          })),
        );
      }
    }
  });

  const [row] = await dbClient
    .update(dbSchema.category)
    .set({
      name: input.name,
      favoriteItem: input.favoriteItem,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(dbSchema.category.userId, input.userId),
        eq(dbSchema.category.categoryId, input.categoryId),
      ),
    )
    .returning();

  return row ? toCategoryResponse(row) : null;
}

export async function deleteCategory(input: {
  userId: string;
  categoryId: string;
}): Promise<void> {
  await dbClient
    .delete(dbSchema.category)
    .where(
      and(
        eq(dbSchema.category.userId, input.userId),
        eq(dbSchema.category.categoryId, input.categoryId),
      ),
    );
}

function toCategoryResponse(row: {
  categoryId: string;
  name: string;
  favoriteItem: string | null;
}): CategoryResponse {
  return {
    categoryId: row.categoryId,
    name: row.name,
    favoriteItem: row.favoriteItem,
  };
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
