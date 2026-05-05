import { after, before, beforeEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { FastifyInstance } from 'fastify';
import { createAuthCookie, createTestApp, expectValidationError } from '../helpers/app.js';
import { linkItemToCategory, resetDb, seedCategory, seedItem, seedOutfit, seedUser } from '../helpers/db.js';

let app: FastifyInstance;

describe('routes/items', () => {
  before(async () => {
    app = await createTestApp();
  });

  beforeEach(async () => {
    await resetDb();
  });

  after(async () => {
    await app.close();
  });

  it('requires authentication', async () => {
    const response = await app.inject({ method: 'GET', url: '/items' });
    assert.equal(response.statusCode, 401);
  });

  it('lists items and supports category filtering', async () => {
    await seedUser();
    const item1 = await seedItem('11111111-1111-1111-1111-111111111111');
    const item2 = await seedItem('11111111-1111-1111-1111-111111111111');
    const category = await seedCategory('11111111-1111-1111-1111-111111111111', { name: 'Layer' });
    await linkItemToCategory(item2.item_id, category.category_id);

    const all = await app.inject({ method: 'GET', url: '/items', headers: { cookie: await createAuthCookie() } });
    assert.equal(all.statusCode, 200);
    assert.equal(all.json().data.length, 2);

    const filtered = await app.inject({
      method: 'GET',
      url: `/items?categories=${category.category_id}`,
      headers: { cookie: await createAuthCookie() },
    });
    assert.equal(filtered.statusCode, 200);
    assert.equal(filtered.json().data.length, 1);
    assert.equal(filtered.json().data[0].itemId, item2.item_id);
    assert.equal(item1.item_id !== item2.item_id, true);
  });

  it('returns random items with and without category filters', async () => {
    await seedUser();
    const item = await seedItem('11111111-1111-1111-1111-111111111111');
    const category = await seedCategory('11111111-1111-1111-1111-111111111111');
    await linkItemToCategory(item.item_id, category.category_id);

    const random = await app.inject({ method: 'GET', url: '/items/random', headers: { cookie: await createAuthCookie() } });
    assert.equal(random.statusCode, 200);

    const randomFiltered = await app.inject({
      method: 'GET',
      url: `/items/random?categories=${category.category_id}`,
      headers: { cookie: await createAuthCookie() },
    });
    assert.equal(randomFiltered.statusCode, 200);
    assert.equal(randomFiltered.json().data.itemId, item.item_id);
  });

  it('rejects item creation when multipart payload has no file', async () => {
    await seedUser();
    const response = await app.inject({
      method: 'POST',
      url: '/items',
      headers: { cookie: await createAuthCookie(), 'content-type': 'multipart/form-data; boundary=empty' },
      payload: '--empty--\r\n',
    });

    assert.equal(response.statusCode, 400);
    assert.deepEqual(response.json(), { success: false, message: 'Image file is required' });
  });

  it('lists and replaces item categories', async () => {
    await seedUser();
    const item = await seedItem('11111111-1111-1111-1111-111111111111');
    const c1 = await seedCategory('11111111-1111-1111-1111-111111111111', { name: 'A' });
    const c2 = await seedCategory('11111111-1111-1111-1111-111111111111', { name: 'B' });
    await linkItemToCategory(item.item_id, c1.category_id);

    const before = await app.inject({
      method: 'GET',
      url: `/items/${item.item_id}/categories`,
      headers: { cookie: await createAuthCookie() },
    });
    assert.equal(before.statusCode, 200);
    assert.equal(before.json().data.length, 1);

    const updated = await app.inject({
      method: 'PUT',
      url: `/items/${item.item_id}/categories`,
      headers: { cookie: await createAuthCookie() },
      payload: { categories: [c1.category_id, c2.category_id, c2.category_id] },
    });
    assert.equal(updated.statusCode, 200);

    const afterList = await app.inject({
      method: 'GET',
      url: `/items/${item.item_id}/categories`,
      headers: { cookie: await createAuthCookie() },
    });
    assert.equal(afterList.statusCode, 200);
    assert.equal(afterList.json().data.length, 2);
  });

  it('rejects invalid replacement payloads and unknown item/category ownership', async () => {
    await seedUser();
    const item = await seedItem('11111111-1111-1111-1111-111111111111');

    const invalidPayload = await app.inject({
      method: 'PUT',
      url: `/items/${item.item_id}/categories`,
      headers: { cookie: await createAuthCookie() },
      payload: { categories: 'not-an-array' },
    });
    expectValidationError(invalidPayload);

    const missingItem = await app.inject({
      method: 'PUT',
      url: '/items/00000000-0000-0000-0000-000000000001/categories',
      headers: { cookie: await createAuthCookie() },
      payload: { categories: [] },
    });
    assert.equal(missingItem.statusCode, 404);

    const otherUser = await seedUser({ userId: '22222222-2222-2222-2222-222222222222', email: 'other@example.com' });
    const foreignCategory = await seedCategory(otherUser.user_id);
    const invalidCategory = await app.inject({
      method: 'PUT',
      url: `/items/${item.item_id}/categories`,
      headers: { cookie: await createAuthCookie() },
      payload: { categories: [foreignCategory.category_id] },
    });
    assert.equal(invalidCategory.statusCode, 400);
  });

  it('prevents deleting items referenced by outfits and allows deletion when unreferenced', async () => {
    await seedUser();
    const item = await seedItem('11111111-1111-1111-1111-111111111111');
    await seedOutfit('11111111-1111-1111-1111-111111111111', { layout: [[{ itemId: item.item_id, weight: 1 }]] });

    const blocked = await app.inject({
      method: 'DELETE',
      url: `/items/${item.item_id}`,
      headers: { cookie: await createAuthCookie() },
    });
    assert.equal(blocked.statusCode, 409);

    await resetDb();
    await seedUser();
    const deletable = await seedItem('11111111-1111-1111-1111-111111111111');
    const deleted = await app.inject({
      method: 'DELETE',
      url: `/items/${deletable.item_id}`,
      headers: { cookie: await createAuthCookie() },
    });
    assert.equal(deleted.statusCode, 200);
  });
});
