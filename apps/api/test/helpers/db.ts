import { sql } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import type { OutfitLayoutModel } from '@fit-check/shared/types/models';
import { applyTestEnv } from './env.js';

const getDb = async () => {
  applyTestEnv();
  const mod = await import('../../lib/database/client.js');
  return mod.default;
};

export const resetDb = async () => {
  const db = await getDb();
  await db.execute(sql.raw('DELETE FROM item_to_category'));
  await db.execute(sql.raw('DELETE FROM outfits'));
  await db.execute(sql.raw('DELETE FROM categories'));
  await db.execute(sql.raw('DELETE FROM items'));
  await db.execute(sql.raw('DELETE FROM users'));
};

export const seedUser = async (overrides: { userId?: string; email?: string; providerId?: string } = {}) => {
  const db = await getDb();
  const userId = overrides.userId ?? '11111111-1111-1111-1111-111111111111';
  const email = overrides.email ?? 'user@example.com';
  const providerId = overrides.providerId ?? `google-${userId}`;

  const inserted = await db.execute(sql`
    INSERT INTO users (user_id, provider, provider_id, email)
    VALUES (${userId}::uuid, 'google', ${providerId}, ${email})
    RETURNING user_id, provider, provider_id, email
  `);

  return inserted.rows[0] as { user_id: string; provider: string; provider_id: string; email: string };
};

export const seedItem = async (userId: string, overrides: { itemId?: string; imagePath?: string } = {}) => {
  const db = await getDb();
  const itemId = overrides.itemId ?? randomUUID();
  const imagePath = overrides.imagePath ?? `https://cdn.example.com/items/${itemId}.png`;

  const inserted = await db.execute(sql`
    INSERT INTO items (item_id, user_id, image_path, image_width, image_height)
    VALUES (${itemId}::uuid, ${userId}::uuid, ${imagePath}, 100, 200)
    RETURNING item_id, image_path, image_width, image_height
  `);

  return inserted.rows[0] as { item_id: string; image_path: string; image_width: number; image_height: number };
};

export const seedCategory = async (
  userId: string,
  overrides: { categoryId?: string; name?: string; favoriteItem?: string | null } = {},
) => {
  const db = await getDb();
  const categoryId = overrides.categoryId ?? randomUUID();
  const name = overrides.name ?? `Category-${categoryId.slice(0, 6)}`;
  const favoriteItem = overrides.favoriteItem ?? null;

  if (favoriteItem) {
    const inserted = await db.execute(sql`
      INSERT INTO categories (category_id, user_id, name, favorite_item)
      VALUES (${categoryId}::uuid, ${userId}::uuid, ${name}, ${favoriteItem}::uuid)
      RETURNING category_id, name, favorite_item
    `);

    return inserted.rows[0] as { category_id: string; name: string; favorite_item: string | null };
  }

  const inserted = await db.execute(sql`
    INSERT INTO categories (category_id, user_id, name, favorite_item)
    VALUES (${categoryId}::uuid, ${userId}::uuid, ${name}, NULL)
    RETURNING category_id, name, favorite_item
  `);

  return inserted.rows[0] as { category_id: string; name: string; favorite_item: string | null };
};

export const linkItemToCategory = async (itemId: string, categoryId: string) => {
  const db = await getDb();
  await db.execute(sql`
    INSERT INTO item_to_category (item_id, category_id)
    VALUES (${itemId}::uuid, ${categoryId}::uuid)
  `);
};

export const seedOutfit = async (
  userId: string,
  overrides: { outfitId?: string; dateWorn?: string; description?: string | null; layout?: OutfitLayoutModel } = {},
) => {
  const db = await getDb();
  const outfitId = overrides.outfitId ?? randomUUID();
  const dateWorn = overrides.dateWorn ?? '2026-05-03';
  const description = overrides.description ?? 'seed outfit';
  const layout = overrides.layout ?? [];

  const inserted = await db.execute(sql`
    INSERT INTO outfits (outfit_id, user_id, date_worn, description, layout)
    VALUES (${outfitId}::uuid, ${userId}::uuid, ${dateWorn}, ${description}, ${JSON.stringify(layout)}::jsonb)
    RETURNING outfit_id, date_worn, description, layout
  `);

  return inserted.rows[0] as { outfit_id: string; date_worn: string; description: string | null; layout: OutfitLayoutModel };
};
