import { after, before, beforeEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { FastifyInstance } from 'fastify';
import { createAuthCookie, createTestApp, expectValidationError } from '../helpers/app.js';
import { resetDb, seedItem, seedOutfit, seedUser } from '../helpers/db.js';

let app: FastifyInstance;

describe('routes/outfits', () => {
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
    const response = await app.inject({ method: 'GET', url: '/outfits' });
    assert.equal(response.statusCode, 401);
  });

  it('lists outfits', async () => {
    await seedUser();
    await seedOutfit('11111111-1111-1111-1111-111111111111', { description: 'seed outfit' });

    const response = await app.inject({ method: 'GET', url: '/outfits', headers: { cookie: await createAuthCookie() } });
    assert.equal(response.statusCode, 200);
    assert.equal(response.json().data.length, 1);
  });

  it('creates outfits when layout item ownership is valid', async () => {
    await seedUser();
    const item = await seedItem('11111111-1111-1111-1111-111111111111');

    const response = await app.inject({
      method: 'POST',
      url: '/outfits',
      headers: { cookie: await createAuthCookie() },
      payload: {
        dateWorn: '2026-05-03',
        description: 'fit of day',
        layout: [[{ itemId: item.item_id, weight: 1 }]],
      },
    });

    assert.equal(response.statusCode, 201);
    assert.equal(response.json().data.description, 'fit of day');
  });

  it('rejects invalid payloads and non-owned layout items', async () => {
    await seedUser();

    const invalid = await app.inject({
      method: 'POST',
      url: '/outfits',
      headers: { cookie: await createAuthCookie() },
      payload: { dateWorn: '05/03/2026', layout: [] },
    });
    expectValidationError(invalid);

    const notOwned = await app.inject({
      method: 'POST',
      url: '/outfits',
      headers: { cookie: await createAuthCookie() },
      payload: {
        dateWorn: '2026-05-03',
        layout: [[{ itemId: '00000000-0000-0000-0000-000000000001', weight: 1 }]],
      },
    });
    assert.equal(notOwned.statusCode, 400);
    assert.equal(notOwned.json().message, 'layout includes one or more items not owned by the user');
  });

  it('deletes outfits and returns 404 for missing outfits', async () => {
    await seedUser();
    const outfit = await seedOutfit('11111111-1111-1111-1111-111111111111');

    const deleted = await app.inject({
      method: 'DELETE',
      url: `/outfits/${outfit.outfit_id}`,
      headers: { cookie: await createAuthCookie() },
    });
    assert.equal(deleted.statusCode, 200);

    const missing = await app.inject({
      method: 'DELETE',
      url: `/outfits/${outfit.outfit_id}`,
      headers: { cookie: await createAuthCookie() },
    });
    assert.equal(missing.statusCode, 404);
  });

  it('searches outfits and validates query inputs', async () => {
    await seedUser();
    await seedOutfit('11111111-1111-1111-1111-111111111111', { description: 'rain jacket fit' });
    await seedOutfit('11111111-1111-1111-1111-111111111111', { description: 'gym day' });

    const found = await app.inject({
      method: 'GET',
      url: '/outfits/search?query=jacket',
      headers: { cookie: await createAuthCookie() },
    });
    assert.equal(found.statusCode, 200);
    assert.equal(found.json().data.length, 1);

    const missingQuery = await app.inject({
      method: 'GET',
      url: '/outfits/search',
      headers: { cookie: await createAuthCookie() },
    });
    expectValidationError(missingQuery);

    const blank = await app.inject({
      method: 'GET',
      url: '/outfits/search?query=%20%20',
      headers: { cookie: await createAuthCookie() },
    });
    assert.equal(blank.statusCode, 400);
    assert.equal(blank.json().message, 'query is required');
  });
});
