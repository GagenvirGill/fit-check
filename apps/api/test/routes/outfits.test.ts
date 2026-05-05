import { after, before, beforeEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { FastifyInstance } from 'fastify';
import { createAuthCookie, createTestApp, expectValidationError } from '../helpers/app.js';
import { resetDb, seedItem, seedOutfit, seedUser } from '../helpers/db.js';

let app: FastifyInstance;

void describe('routes/outfits', () => {
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
    const response = await app.inject({ method: 'POST', url: '/outfits', payload: { dateWorn: '2026-05-03', layout: [] } });
    assert.equal(response.statusCode, 401);
  });

  void it('creates outfits when layout item ownership is valid', async () => {
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
    assert.equal(response.json().description, 'fit of day');
  });

  void it('rejects invalid payloads and non-owned layout items', async () => {
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

  void it('deletes outfits and returns 404 for missing outfits', async () => {
    await seedUser();
    const outfit = await seedOutfit('11111111-1111-1111-1111-111111111111');

    const deleted = await app.inject({
      method: 'DELETE',
      url: `/outfits/${outfit.outfit_id}`,
      headers: { cookie: await createAuthCookie() },
    });
    assert.equal(deleted.statusCode, 204);

    const missing = await app.inject({
      method: 'DELETE',
      url: `/outfits/${outfit.outfit_id}`,
      headers: { cookie: await createAuthCookie() },
    });
    assert.equal(missing.statusCode, 404);
  });
});
