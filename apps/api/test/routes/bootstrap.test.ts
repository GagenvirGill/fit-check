import { after, before, beforeEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { FastifyInstance } from 'fastify';
import { createAuthCookie, createTestApp } from '../helpers/app.js';
import { linkItemToCategory, resetDb, seedCategory, seedItem, seedOutfit, seedUser } from '../helpers/db.js';

let app: FastifyInstance;

void describe('routes/bootstrap', () => {
  void before(async () => {
    app = await createTestApp();
  });

  void beforeEach(async () => {
    await resetDb();
  });

  void after(async () => {
    await app.close();
  });

  void it('requires authentication', async () => {
    const response = await app.inject({ method: 'GET', url: '/bootstrap' });
    assert.equal(response.statusCode, 401);
  });

  void it('returns aggregated bootstrap data for the authenticated user', async () => {
    const user = await seedUser();
    const item = await seedItem(user.user_id);
    const category = await seedCategory(user.user_id, { favoriteItem: item.item_id });
    await linkItemToCategory(item.item_id, category.category_id);
    await seedOutfit(user.user_id, {
      layout: [[{ itemId: item.item_id, weight: 1 }]],
      description: 'seed outfit',
    });

    const response = await app.inject({ method: 'GET', url: '/bootstrap', headers: { cookie: await createAuthCookie() } });
    const payload = response.json();

    assert.equal(response.statusCode, 200);
    assert.equal(payload.user.userId, user.user_id);
    assert.equal(payload.categories.length, 1);
    assert.equal(payload.items.length, 1);
    assert.equal(payload.outfits.length, 1);
    assert.deepEqual(payload.itemCategoryLinks, [
      {
        itemId: item.item_id,
        categoryId: category.category_id,
      },
    ]);
  });

  void it('returns only item-category links owned by the authenticated user', async () => {
    const authUser = await seedUser();
    const authItem = await seedItem(authUser.user_id);
    const authCategory = await seedCategory(authUser.user_id);
    await linkItemToCategory(authItem.item_id, authCategory.category_id);

    const otherUser = await seedUser({
      userId: '22222222-2222-2222-2222-222222222222',
      email: 'other-user@example.com',
    });
    const otherItem = await seedItem(otherUser.user_id);
    const otherCategory = await seedCategory(otherUser.user_id);
    await linkItemToCategory(otherItem.item_id, otherCategory.category_id);

    const response = await app.inject({ method: 'GET', url: '/bootstrap', headers: { cookie: await createAuthCookie() } });
    const payload = response.json();

    assert.equal(response.statusCode, 200);
    assert.deepEqual(payload.itemCategoryLinks, [
      {
        itemId: authItem.item_id,
        categoryId: authCategory.category_id,
      },
    ]);
  });
});
