import { after, before, beforeEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { FastifyInstance } from 'fastify';
import { createAuthCookie, createTestApp, expectValidationError } from '../helpers/app.js';
import { linkItemToCategory, resetDb, seedCategory, seedItem, seedUser } from '../helpers/db.js';

let app: FastifyInstance;

void describe('routes/categories', () => {
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
    const response = await app.inject({ method: 'POST', url: '/categories', payload: { name: 'Tops' } });
    assert.equal(response.statusCode, 401);
  });

  void it('creates categories', async () => {
    const user = await seedUser();
    const createResponse = await app.inject({
      method: 'POST',
      url: '/categories',
      headers: { cookie: await createAuthCookie() },
      payload: { name: '  Tops  ' },
    });

    assert.equal(createResponse.statusCode, 201);
    assert.equal(createResponse.json().name, 'Tops');
    assert.equal(typeof createResponse.json().categoryId, 'string');
    assert.equal(user.user_id, '11111111-1111-1111-1111-111111111111');
  });

  void it('rejects invalid create payloads with schema errors', async () => {
    await seedUser();
    const response = await app.inject({
      method: 'POST',
      url: '/categories',
      headers: { cookie: await createAuthCookie() },
      payload: { name: 123 },
    });
    expectValidationError(response);
  });

  void it('enforces unique category names per user', async () => {
    await seedUser();
    await seedCategory('11111111-1111-1111-1111-111111111111', { name: 'Shoes' });

    const response = await app.inject({
      method: 'POST',
      url: '/categories',
      headers: { cookie: await createAuthCookie() },
      payload: { name: 'Shoes' },
    });

    assert.equal(response.statusCode, 409);
    assert.equal(response.json().message, 'Category name already exists for this user');
  });

  void it('updates category fields, including favoriteItem ownership checks', async () => {
    await seedUser();
    const item = await seedItem('11111111-1111-1111-1111-111111111111');
    const category = await seedCategory('11111111-1111-1111-1111-111111111111', { name: 'Hats' });

    const response = await app.inject({
      method: 'PATCH',
      url: `/categories/${category.category_id}`,
      headers: { cookie: await createAuthCookie() },
      payload: { name: 'Caps', favoriteItem: item.item_id },
    });

    assert.equal(response.statusCode, 200);
    assert.equal(response.json().name, 'Caps');
    assert.equal(response.json().favoriteItem, item.item_id);
  });

  void it('replaces category item links when itemIds are provided', async () => {
    await seedUser();
    const category = await seedCategory('11111111-1111-1111-1111-111111111111', { name: 'Bottoms' });
    const itemOne = await seedItem('11111111-1111-1111-1111-111111111111');
    const itemTwo = await seedItem('11111111-1111-1111-1111-111111111111');
    const itemThree = await seedItem('11111111-1111-1111-1111-111111111111');

    await linkItemToCategory(itemOne.item_id, category.category_id);
    await linkItemToCategory(itemTwo.item_id, category.category_id);

    const response = await app.inject({
      method: 'PATCH',
      url: `/categories/${category.category_id}`,
      headers: { cookie: await createAuthCookie() },
      payload: { itemIds: [itemThree.item_id, itemThree.item_id] },
    });

    assert.equal(response.statusCode, 200);
    assert.equal(response.json().categoryId, category.category_id);

    const bootstrap = await app.inject({
      method: 'GET',
      url: '/bootstrap',
      headers: { cookie: await createAuthCookie() },
    });
    assert.equal(bootstrap.statusCode, 200);
    assert.deepEqual(bootstrap.json().itemCategoryLinks, [
      { itemId: itemThree.item_id, categoryId: category.category_id },
    ]);
  });

  void it('rejects category itemIds that are not owned by the authenticated user', async () => {
    await seedUser();
    const category = await seedCategory('11111111-1111-1111-1111-111111111111');
    await seedUser({ userId: '22222222-2222-2222-2222-222222222222', email: 'other@example.com' });
    const foreignItem = await seedItem('22222222-2222-2222-2222-222222222222');

    const response = await app.inject({
      method: 'PATCH',
      url: `/categories/${category.category_id}`,
      headers: { cookie: await createAuthCookie() },
      payload: { itemIds: [foreignItem.item_id] },
    });

    assert.equal(response.statusCode, 400);
    assert.equal(response.json().message, 'One or more itemIds were not found for this user');
  });

  void it('deletes categories and returns 404 for missing categories', async () => {
    await seedUser();
    const category = await seedCategory('11111111-1111-1111-1111-111111111111');

    const deleted = await app.inject({
      method: 'DELETE',
      url: `/categories/${category.category_id}`,
      headers: { cookie: await createAuthCookie() },
    });
    assert.equal(deleted.statusCode, 204);

    const missing = await app.inject({
      method: 'DELETE',
      url: `/categories/${category.category_id}`,
      headers: { cookie: await createAuthCookie() },
    });
    assert.equal(missing.statusCode, 404);
  });
});
