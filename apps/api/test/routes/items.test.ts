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
    const response = await app.inject({
      method: 'POST',
      url: '/items',
      headers: { 'content-type': 'multipart/form-data; boundary=empty' },
      payload: '--empty--\r\n',
    });
    assert.equal(response.statusCode, 401);
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

  it('replaces item categories through PATCH /items/:id', async () => {
    await seedUser();
    const item = await seedItem('11111111-1111-1111-1111-111111111111');
    const c1 = await seedCategory('11111111-1111-1111-1111-111111111111', { name: 'A' });
    const c2 = await seedCategory('11111111-1111-1111-1111-111111111111', { name: 'B' });
    await linkItemToCategory(item.item_id, c1.category_id);

    const updated = await app.inject({
      method: 'PATCH',
      url: `/items/${item.item_id}`,
      headers: { cookie: await createAuthCookie() },
      payload: { categoryIds: [c1.category_id, c2.category_id, c2.category_id] },
    });
    assert.equal(updated.statusCode, 200);

    const clear = await app.inject({
      method: 'PATCH',
      url: `/items/${item.item_id}`,
      headers: { cookie: await createAuthCookie() },
      payload: { categoryIds: [] },
    });
    assert.equal(clear.statusCode, 200);
  });

  it('supports no-op PATCH when categoryIds is omitted', async () => {
    await seedUser();
    const item = await seedItem('11111111-1111-1111-1111-111111111111');

    const response = await app.inject({
      method: 'PATCH',
      url: `/items/${item.item_id}`,
      headers: { cookie: await createAuthCookie() },
      payload: { note: 'noop' },
    });

    assert.equal(response.statusCode, 200);
    assert.equal(response.json().message, 'Item updated');
  });

  it('rejects invalid PATCH payloads and unknown item/category ownership', async () => {
    await seedUser();
    const item = await seedItem('11111111-1111-1111-1111-111111111111');

    const invalidPayload = await app.inject({
      method: 'PATCH',
      url: `/items/${item.item_id}`,
      headers: { cookie: await createAuthCookie() },
      payload: { categoryIds: 'not-an-array' },
    });
    expectValidationError(invalidPayload);

    const missingItem = await app.inject({
      method: 'PATCH',
      url: '/items/00000000-0000-0000-0000-000000000001',
      headers: { cookie: await createAuthCookie() },
      payload: { categoryIds: [] },
    });
    assert.equal(missingItem.statusCode, 404);

    const otherUser = await seedUser({ userId: '22222222-2222-2222-2222-222222222222', email: 'other@example.com' });
    const foreignCategory = await seedCategory(otherUser.user_id);
    const invalidCategory = await app.inject({
      method: 'PATCH',
      url: `/items/${item.item_id}`,
      headers: { cookie: await createAuthCookie() },
      payload: { categoryIds: [foreignCategory.category_id] },
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
