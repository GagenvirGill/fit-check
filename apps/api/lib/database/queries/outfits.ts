import { and, eq, inArray } from 'drizzle-orm';
import type { CreateOutfitResponse } from '@fit-check/shared/types/contracts/outfits';
import type { OutfitLayout } from '@fit-check/shared/types/models';
import * as schema from '@fit-check/database/schema';
import db from '../client';
import { DatabaseQueryError } from '../query-error';

const allItemsBelongToUser = async (userId: string, itemIds: string[]): Promise<boolean> => {
  if (itemIds.length === 0) {
    return true;
  }

  const foundItems = await db
    .select({ itemId: schema.item.itemId })
    .from(schema.item)
    .where(and(eq(schema.item.userId, userId), inArray(schema.item.itemId, itemIds)));

  return foundItems.length === itemIds.length;
};

export const createOutfit = async (
  userId: string,
  payload: {
    dateWorn: string;
    description?: string | null;
    layout: OutfitLayout;
  },
): Promise<CreateOutfitResponse> => {
  const allItemIds = [...new Set(payload.layout.flat().map((item) => item.itemId))];
  const validItems = await allItemsBelongToUser(userId, allItemIds);
  if (!validItems) {
    throw new DatabaseQueryError('layout includes one or more items not owned by the user', 400);
  }

  try {
    const created = await db
      .insert(schema.outfit)
      .values({
        userId,
        dateWorn: payload.dateWorn,
        description: payload.description ?? null,
        layout: payload.layout,
      })
      .returning({
        outfitId: schema.outfit.outfitId,
        dateWorn: schema.outfit.dateWorn,
        description: schema.outfit.description,
        layout: schema.outfit.layout,
      });

    return created[0];
  } catch {
    throw new DatabaseQueryError('Failed to create outfit', 400);
  }
};

export const deleteOutfit = async (
  userId: string,
  outfitId: string,
): Promise<void> => {
  try {
    const deleted = await db
      .delete(schema.outfit)
      .where(and(eq(schema.outfit.outfitId, outfitId), eq(schema.outfit.userId, userId)))
      .returning({ outfitId: schema.outfit.outfitId });

    if (!deleted[0]) {
      throw new DatabaseQueryError('Outfit not found', 404);
    }
  } catch (error) {
    if (error instanceof DatabaseQueryError) {
      throw error;
    }
    throw new DatabaseQueryError('Failed to delete outfit', 400);
  }
};
