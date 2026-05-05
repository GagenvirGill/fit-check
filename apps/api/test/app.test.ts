import { after, before, beforeEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { FastifyInstance } from 'fastify';
import { createTestApp } from './helpers/app.js';
import { resetDb } from './helpers/db.js';

let app: FastifyInstance;

void describe('app', () => {
  void before(async () => {
    app = await createTestApp();
  });

  void beforeEach(async () => {
    await resetDb();
  });

  void after(async () => {
    await app.close();
  });

  void it('serves public health without authentication', async () => {
    const response = await app.inject({ method: 'GET', url: '/health' });
    assert.equal(response.statusCode, 200);
    assert.equal(typeof response.json().uptimeSeconds, 'number');
  });

  void it('blocks protected routes without a session cookie', async () => {
    const response = await app.inject({ method: 'GET', url: '/bootstrap' });
    assert.equal(response.statusCode, 401);
    assert.deepEqual(response.json(), { message: 'Unauthorized' });
  });
});
