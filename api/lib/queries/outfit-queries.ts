import { and, eq, inArray } from "drizzle-orm";

import type { OutfitLayout, OutfitResponse } from "#packages/contracts/outfit";
import { dbSchema } from "#packages/db/schema";
import { dbClient } from "../db-client";

export async function createOutfit(input: {
  userId: string;
  dateWorn: string;
  description?: string | null;
  layout: OutfitLayout;
}): Promise<OutfitResponse | null> {
  const allLayoutItemsExist = await hasLayoutItems(input.userId, input.layout);
  if (!allLayoutItemsExist) {
    return null;
  }

  const [row] = await dbClient
    .insert(dbSchema.outfit)
    .values({
      userId: input.userId,
      dateWorn: input.dateWorn,
      description: input.description,
      layout: input.layout,
    })
    .returning();

  return toOutfitResponse(row);
}

export async function updateOutfit(input: {
  userId: string;
  outfitId: string;
  dateWorn?: string;
  description?: string | null;
  layout?: OutfitLayout;
}): Promise<OutfitResponse | null> {
  if (input.layout) {
    const hasItems = await hasLayoutItems(input.userId, input.layout);
    if (!hasItems) {
      return null;
    }
  }

  const [row] = await dbClient
    .update(dbSchema.outfit)
    .set({
      dateWorn: input.dateWorn,
      description: input.description,
      layout: input.layout,
      updatedAt: new Date(),
    })
    .where(and(eq(dbSchema.outfit.userId, input.userId), eq(dbSchema.outfit.outfitId, input.outfitId)))
    .returning();

  return row ? toOutfitResponse(row) : null;
}

export async function deleteOutfit(input: { userId: string; outfitId: string }): Promise<void> {
  await dbClient
    .delete(dbSchema.outfit)
    .where(and(eq(dbSchema.outfit.userId, input.userId), eq(dbSchema.outfit.outfitId, input.outfitId)));
}

function toOutfitResponse(row: {
  outfitId: string;
  dateWorn: string;
  description: string | null;
  layout: OutfitLayout;
}): OutfitResponse {
  return {
    outfitId: row.outfitId,
    dateWorn: row.dateWorn,
    description: row.description,
    layout: row.layout,
  };
}

async function hasLayoutItems(userId: string, layout: OutfitLayout): Promise<boolean> {
  const itemIds = layout.flat().map((item) => item.itemId);
  if (itemIds.length === 0) {
    return true;
  }

  const uniqueItemIds = [...new Set(itemIds)];
  const rows = await dbClient
    .select({ itemId: dbSchema.item.itemId })
    .from(dbSchema.item)
    .where(and(eq(dbSchema.item.userId, userId), inArray(dbSchema.item.itemId, uniqueItemIds)));

  return rows.length === uniqueItemIds.length;
}
