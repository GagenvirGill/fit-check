import { and, asc, desc, eq, inArray, sql } from 'drizzle-orm';
import sizeOf from 'image-size';
import * as schema from '@fit-check/database/schema';
import type { MultipartFile } from '@fastify/multipart';
import db from '../lib/database';
import { deleteItemImageByUrl, uploadItemImage } from '../lib/cloud-storage';
import { normalizeLayout } from '../lib/outfit-layout';

export const parseCategoryFilter = (raw?: string): string[] => {
  if (!raw) {
    return [];
  }

  return raw
    .split(',')
    .map((value) => value.trim())
    .filter((value) => value.length > 0);
};

export const parseCategoryIdsBody = (body: unknown): string[] => {
  if (typeof body !== 'object' || body === null || !('categories' in body)) {
    throw Object.assign(new Error('categories must be provided'), { statusCode: 400 });
  }

  const categories = (body as { categories: unknown }).categories;
  if (!Array.isArray(categories)) {
    throw Object.assign(new Error('categories must be an array'), { statusCode: 400 });
  }

  if (!categories.every((id) => typeof id === 'string' && id.length > 0)) {
    throw Object.assign(new Error('categories must contain non-empty string IDs'), { statusCode: 400 });
  }

  return [...new Set(categories)];
};

export const listItems = async (userId: string) =>
  db
    .select({
      itemId: schema.item.itemId,
      imagePath: schema.item.imagePath,
      imageWidth: schema.item.imageWidth,
      imageHeight: schema.item.imageHeight,
    })
    .from(schema.item)
    .where(eq(schema.item.userId, userId))
    .orderBy(desc(schema.item.createdAt));

export const listItemsByCategories = async (userId: string, categoryIds: string[]) =>
  db
    .selectDistinct({
      itemId: schema.item.itemId,
      imagePath: schema.item.imagePath,
      imageWidth: schema.item.imageWidth,
      imageHeight: schema.item.imageHeight,
    })
    .from(schema.item)
    .innerJoin(schema.itemToCategory, eq(schema.item.itemId, schema.itemToCategory.itemId))
    .where(and(eq(schema.item.userId, userId), inArray(schema.itemToCategory.categoryId, categoryIds)))
    .orderBy(desc(schema.item.createdAt));

export const getRandomItem = async (userId: string) => {
  const randomItem = await db
    .select({
      itemId: schema.item.itemId,
      imagePath: schema.item.imagePath,
      imageWidth: schema.item.imageWidth,
      imageHeight: schema.item.imageHeight,
    })
    .from(schema.item)
    .where(eq(schema.item.userId, userId))
    .orderBy(sql`RANDOM()`)
    .limit(1);

  return randomItem[0] ?? null;
};

export const getRandomItemByCategories = async (userId: string, categoryIds: string[]) => {
  const randomFiltered = await db
    .selectDistinct({
      itemId: schema.item.itemId,
      imagePath: schema.item.imagePath,
      imageWidth: schema.item.imageWidth,
      imageHeight: schema.item.imageHeight,
    })
    .from(schema.item)
    .innerJoin(schema.itemToCategory, eq(schema.item.itemId, schema.itemToCategory.itemId))
    .where(and(eq(schema.item.userId, userId), inArray(schema.itemToCategory.categoryId, categoryIds)))
    .orderBy(sql`RANDOM()`)
    .limit(1);

  return randomFiltered[0] ?? null;
};

export const createItemFromUpload = async (userId: string, file: MultipartFile) => {
  const buffer = await file.toBuffer();
  const dimensions = sizeOf(buffer);
  if (!dimensions.width || !dimensions.height) {
    throw Object.assign(new Error('Failed to determine image dimensions'), { statusCode: 400 });
  }

  const uploadedPath = await uploadItemImage(file.filename, file.mimetype, buffer);

  try {
    const inserted = await db
      .insert(schema.item)
      .values({
        userId,
        imagePath: uploadedPath,
        imageWidth: dimensions.width,
        imageHeight: dimensions.height,
      })
      .returning();

    return inserted[0];
  } catch (error) {
    try {
      await deleteItemImageByUrl(uploadedPath);
    } catch {
      // Best-effort cleanup to avoid orphaned objects when DB write fails.
    }
    throw error;
  }
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

export const canDeleteItem = async (userId: string, itemId: string) => {
  const outfits = await db
    .select({
      outfitId: schema.outfit.outfitId,
      layout: schema.outfit.layout,
    })
    .from(schema.outfit)
    .where(eq(schema.outfit.userId, userId));

  return !outfits.some((outfit) =>
    normalizeLayout(outfit.layout).some((row) => row.some((entry) => entry.itemId === itemId)),
  );
};

export const deleteItem = async (userId: string, itemId: string, imagePath: string) => {
  await db.delete(schema.item).where(and(eq(schema.item.itemId, itemId), eq(schema.item.userId, userId)));

  try {
    await deleteItemImageByUrl(imagePath);
  } catch {
    // The source of truth is the DB row removal; storage cleanup can be retried later.
  }
};

export const listItemCategories = async (userId: string, itemId: string) =>
  db
    .select({
      categoryId: schema.category.categoryId,
      name: schema.category.name,
      favoriteItem: schema.category.favoriteItem,
    })
    .from(schema.category)
    .innerJoin(schema.itemToCategory, eq(schema.category.categoryId, schema.itemToCategory.categoryId))
    .innerJoin(schema.item, eq(schema.item.itemId, schema.itemToCategory.itemId))
    .where(and(eq(schema.item.itemId, itemId), eq(schema.item.userId, userId)))
    .orderBy(asc(schema.category.name));

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
