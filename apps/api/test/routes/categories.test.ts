import { after, before, beforeEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { FastifyInstance } from 'fastify';
import { createAuthCookie, createTestApp, expectValidationError } from '../helpers/app.js';
import { resetDb, seedCategory, seedItem, seedUser } from '../helpers/db.js';

let app: FastifyInstance;

describe('routes/categories', () => {
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
    const response = await app.inject({ method: 'POST', url: '/categories', payload: { name: 'Tops' } });
    assert.equal(response.statusCode, 401);
  });

  it('creates categories', async () => {
    const user = await seedUser();
    const createResponse = await app.inject({
      method: 'POST',
      url: '/categories',
      headers: { cookie: await createAuthCookie() },
      payload: { name: '  Tops  ' },
    });

    assert.equal(createResponse.statusCode, 201);
    assert.equal(createResponse.json().data.name, 'Tops');
    assert.equal(typeof createResponse.json().data.categoryId, 'string');
    assert.equal(user.user_id, '11111111-1111-1111-1111-111111111111');
  });

  it('rejects invalid create payloads with schema errors', async () => {
    await seedUser();
    const response = await app.inject({
      method: 'POST',
      url: '/categories',
      headers: { cookie: await createAuthCookie() },
      payload: { name: 123 },
    });
    expectValidationError(response);
  });

  it('enforces unique category names per user', async () => {
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

  it('updates category fields, including favoriteItem ownership checks', async () => {
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
    assert.equal(response.json().data.name, 'Caps');
    assert.equal(response.json().data.favoriteItem, item.item_id);
  });

  it('deletes categories and returns 404 for missing categories', async () => {
    await seedUser();
    const category = await seedCategory('11111111-1111-1111-1111-111111111111');

    const deleted = await app.inject({
      method: 'DELETE',
      url: `/categories/${category.category_id}`,
      headers: { cookie: await createAuthCookie() },
    });
    assert.equal(deleted.statusCode, 200);

    const missing = await app.inject({
      method: 'DELETE',
      url: `/categories/${category.category_id}`,
      headers: { cookie: await createAuthCookie() },
    });
    assert.equal(missing.statusCode, 404);
  });
});
