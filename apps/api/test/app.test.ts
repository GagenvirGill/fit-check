import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import type { FastifyInstance } from 'fastify';
import { applyTestEnv } from './helpers/env.js';

let app: FastifyInstance;

describe('app routes', () => {
  before(async () => {
    applyTestEnv();
    const mod = await import('../app.js');
    app = await mod.createApp();
  });

  after(async () => {
    await app.close();
  });

  it('returns health response without authentication', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/health',
    });

    assert.equal(response.statusCode, 200);
    const payload = response.json();
    assert.equal(payload.success, true);
    assert.equal(typeof payload.data.uptimeSeconds, 'number');
  });

  it('blocks protected route without session cookie', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/bootstrap',
    });

    assert.equal(response.statusCode, 401);
    assert.deepEqual(response.json(), {
      success: false,
      message: 'Unauthorized',
    });
  });

  it('starts google auth redirect and sets state cookie', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/auth/google',
    });

    assert.equal(response.statusCode, 302);
    assert.ok(response.headers.location);
    assert.ok(response.headers.location?.startsWith('https://accounts.google.com/o/oauth2/v2/auth'));
    const setCookie = response.headers['set-cookie'];
    const normalized = Array.isArray(setCookie) ? setCookie.join(';') : (setCookie ?? '');
    assert.match(normalized, /fitcheck_oauth_state=/);
  });

  it('rejects callback state mismatch before token exchange', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/auth/google/callback?code=abc&state=wrong-state',
      cookies: {
        fitcheck_oauth_state: 'expected-state',
      },
    });

    assert.equal(response.statusCode, 401);
    assert.deepEqual(response.json(), {
      success: false,
      message: 'OAuth state validation failed',
    });
  });

  it('rejects /auth/me without session cookie', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/auth/me',
    });

    assert.equal(response.statusCode, 401);
    assert.deepEqual(response.json(), {
      success: false,
      message: 'Unauthorized',
    });
  });

  it('returns logout success and clears cookie', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/auth/logout',
    });

    assert.equal(response.statusCode, 200);
    assert.equal(response.json().success, true);
    const setCookie = response.headers['set-cookie'];
    const normalized = Array.isArray(setCookie) ? setCookie.join(';') : (setCookie ?? '');
    assert.match(normalized, /fitcheck_session=/);
  });
});
