import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { FastifyInstance } from 'fastify';
import { applyTestEnv } from './helpers/env.js';

let app: FastifyInstance;

const protectedRoutes = [
  { method: 'GET', url: '/bootstrap' },
  { method: 'GET', url: '/items' },
  { method: 'GET', url: '/items/random' },
  { method: 'GET', url: '/categories' },
  { method: 'GET', url: '/outfits' },
  { method: 'GET', url: '/outfits/search?query=test' },
];

describe('protected route enforcement', () => {
  before(async () => {
    applyTestEnv();
    const mod = await import('../app.js');
    app = await mod.createApp();
  });

  after(async () => {
    await app.close();
  });

  for (const route of protectedRoutes) {
    it(`returns 401 for ${route.method} ${route.url} when session is missing`, async () => {
      const response = await app.inject({
        method: route.method as 'GET',
        url: route.url,
      });

      assert.equal(response.statusCode, 401);
      assert.deepEqual(response.json(), {
        success: false,
        message: 'Unauthorized',
      });
    });
  }
});
