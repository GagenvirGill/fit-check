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
  });
});
