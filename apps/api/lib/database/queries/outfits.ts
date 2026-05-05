import { and, eq, inArray } from 'drizzle-orm';
import * as schema from '@fit-check/database/schema';
import db from '../client';

export const allItemsBelongToUser = async (userId: string, itemIds: string[]) => {
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
    layout: unknown;
  },
) => {
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
};

export const deleteOutfit = async (userId: string, outfitId: string) =>
  db
    .delete(schema.outfit)
    .where(and(eq(schema.outfit.outfitId, outfitId), eq(schema.outfit.userId, userId)))
    .returning({ outfitId: schema.outfit.outfitId });
