import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { FastifyInstance } from 'fastify';
import { applyTestEnv } from './helpers/env.js';

let app: FastifyInstance;
let authCookie: string;

describe('route validation behavior', () => {
  before(async () => {
    applyTestEnv();
    const appMod = await import('../app.js');
    const authMod = await import('../lib/auth/session.js');
    app = await appMod.createApp();
    const token = authMod.createSessionJwt({ userId: 'user-1', email: 'user@example.com' });
    authCookie = `fitcheck_session=${token}`;
  });

  after(async () => {
    await app.close();
  });

  it('rejects category creation without a name', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/categories',
      headers: { cookie: authCookie },
      payload: {},
    });

    assert.equal(response.statusCode, 400);
    assert.deepEqual(response.json(), { success: false, message: 'Category name is required' });
  });

  it('rejects category update with no valid fields', async () => {
    const response = await app.inject({
      method: 'PATCH',
      url: '/categories/category-1',
      headers: { cookie: authCookie },
      payload: {},
    });

    assert.equal(response.statusCode, 400);
    assert.deepEqual(response.json(), { success: false, message: 'No valid category updates provided' });
  });

  it('rejects item creation when file is missing', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/items',
      headers: { cookie: authCookie },
    });

    assert.equal(response.statusCode, 406);
    const payload = response.json();
    assert.equal(payload.success, false);
    assert.match(payload.message, /multipart/i);
  });

  it('rejects item category replacement with invalid categories payload', async () => {
    const response = await app.inject({
      method: 'PUT',
      url: '/items/item-1/categories',
      headers: { cookie: authCookie },
      payload: { categories: 'not-an-array' },
    });

    assert.equal(response.statusCode, 400);
    assert.deepEqual(response.json(), { success: false, message: 'categories must be an array' });
  });

  it('rejects outfit creation when dateWorn is missing', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/outfits',
      headers: { cookie: authCookie },
      payload: { layout: [] },
    });

    assert.equal(response.statusCode, 400);
    assert.deepEqual(response.json(), { success: false, message: 'dateWorn is required' });
  });

  it('rejects outfit creation with invalid layout', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/outfits',
      headers: { cookie: authCookie },
      payload: { dateWorn: '2026-05-03', layout: { bad: true } },
    });

    assert.equal(response.statusCode, 400);
    assert.deepEqual(response.json(), {
      success: false,
      message: 'layout must be a two-dimensional array of { itemId, weight }',
    });
  });

  it('rejects outfit search without query', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/outfits/search?query=',
      headers: { cookie: authCookie },
    });

    assert.equal(response.statusCode, 400);
    assert.deepEqual(response.json(), { success: false, message: 'query is required' });
  });
});
