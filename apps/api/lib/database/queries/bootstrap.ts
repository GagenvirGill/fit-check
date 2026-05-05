import { asc, eq } from 'drizzle-orm';
import * as schema from '@fit-check/database/schema';
import db from '../client';

export const getBootstrapData = async (userId: string) => {
  const [userRecord, categories, items, outfits] = await Promise.all([
    db
      .select({
        userId: schema.user.userId,
        email: schema.user.email,
        provider: schema.user.provider,
      })
      .from(schema.user)
      .where(eq(schema.user.userId, userId))
      .limit(1),
    db
      .select({
        categoryId: schema.category.categoryId,
        name: schema.category.name,
        favoriteItem: schema.category.favoriteItem,
      })
      .from(schema.category)
      .where(eq(schema.category.userId, userId))
      .orderBy(asc(schema.category.name)),
    db
      .select({
        itemId: schema.item.itemId,
        imagePath: schema.item.imagePath,
        imageWidth: schema.item.imageWidth,
        imageHeight: schema.item.imageHeight,
      })
      .from(schema.item)
      .where(eq(schema.item.userId, userId))
      .orderBy(asc(schema.item.createdAt)),
    db
      .select({
        outfitId: schema.outfit.outfitId,
        dateWorn: schema.outfit.dateWorn,
        description: schema.outfit.description,
        layout: schema.outfit.layout,
      })
      .from(schema.outfit)
      .where(eq(schema.outfit.userId, userId))
      .orderBy(asc(schema.outfit.dateWorn)),
  ]);

  return {
    user: userRecord[0] ?? null,
    categories,
    items,
    outfits,
  };
};
