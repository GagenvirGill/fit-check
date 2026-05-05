import { after, before, beforeEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { FastifyInstance } from 'fastify';
import { createAuthCookie, createTestApp, expectValidationError } from '../helpers/app.js';
import { resetDb, seedUser } from '../helpers/db.js';

let app: FastifyInstance;

describe('routes/auth', () => {
  before(async () => {
    app = await createTestApp();
  });

  beforeEach(async () => {
    await resetDb();
  });

  after(async () => {
    await app.close();
  });

  it('redirects to Google and sets an OAuth state cookie', async () => {
    const response = await app.inject({ method: 'GET', url: '/auth/google' });
    const cookie = response.headers['set-cookie'];
    const normalizedCookie = Array.isArray(cookie) ? cookie.join(';') : (cookie ?? '');

    assert.equal(response.statusCode, 302);
    assert.ok(response.headers.location?.startsWith('https://accounts.google.com/o/oauth2/v2/auth'));
    assert.match(normalizedCookie, /fitcheck_oauth_state=/);
  });

  it('rejects callback payloads that fail schema validation', async () => {
    const response = await app.inject({ method: 'GET', url: '/auth/google/callback?code=abc' });
    expectValidationError(response);
  });

  it('rejects callback state mismatch before OAuth exchange', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/auth/google/callback?code=abc&state=wrong-state',
      cookies: { fitcheck_oauth_state: 'state-123' },
    });

    assert.equal(response.statusCode, 401);
    assert.deepEqual(response.json(), { success: false, message: 'OAuth state validation failed' });
  });

  it('creates a user session on valid callback', async () => {
    const originalFetch = globalThis.fetch;

    globalThis.fetch = (async (input: URL | RequestInfo) => {
      const url = String(input);
      if (url === 'https://oauth2.googleapis.com/token') {
        return new Response(JSON.stringify({ access_token: 'token-123' }), { status: 200 });
      }
      if (url === 'https://openidconnect.googleapis.com/v1/userinfo') {
        return new Response(JSON.stringify({ sub: 'google-11111111-1111-1111-1111-111111111111', email: 'user@example.com' }), { status: 200 });
      }
      return new Response('not found', { status: 404 });
    }) as typeof fetch;

    try {
      const response = await app.inject({
        method: 'GET',
        url: '/auth/google/callback?code=good-code&state=state-123',
        cookies: { fitcheck_oauth_state: 'state-123' },
      });

      assert.equal(response.statusCode, 302);
      assert.equal(response.headers.location, 'http://localhost:5173');
      const cookie = response.headers['set-cookie'];
      const normalized = Array.isArray(cookie) ? cookie.join(';') : (cookie ?? '');
      assert.match(normalized, /fitcheck_session=/);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('returns authenticated user for /auth/me when session maps to an existing user', async () => {
    await seedUser({ userId: '11111111-1111-1111-1111-111111111111', email: 'user@example.com', providerId: 'google-11111111-1111-1111-1111-111111111111' });

    const response = await app.inject({
      method: 'GET',
      url: '/auth/me',
      headers: { cookie: await createAuthCookie() },
    });

    assert.equal(response.statusCode, 200);
    assert.equal(response.json().data.userId, '11111111-1111-1111-1111-111111111111');
    assert.equal(response.json().data.email, 'user@example.com');
  });

  it('rejects /auth/me without a session', async () => {
    const response = await app.inject({ method: 'GET', url: '/auth/me' });
    assert.equal(response.statusCode, 401);
  });

  it('clears the session cookie on logout', async () => {
    const response = await app.inject({ method: 'POST', url: '/auth/logout' });
    assert.equal(response.statusCode, 200);
    const cookie = response.headers['set-cookie'];
    const normalized = Array.isArray(cookie) ? cookie.join(';') : (cookie ?? '');
    assert.match(normalized, /fitcheck_session=/);
  });
});
