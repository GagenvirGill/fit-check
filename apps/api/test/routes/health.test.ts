import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { FastifyInstance } from 'fastify';
import { createTestApp } from '../helpers/app.js';

let app: FastifyInstance;

describe('routes/health', () => {
  before(async () => {
    app = await createTestApp();
  });

  after(async () => {
    await app.close();
  });

  it('returns the health contract', async () => {
    const response = await app.inject({ method: 'GET', url: '/health' });
    const payload = response.json();

    assert.equal(response.statusCode, 200);
    assert.equal(payload.success, true);
    assert.equal(payload.message, 'Server is healthy');
    assert.equal(typeof payload.data.uptimeSeconds, 'number');
  });
});
