import { before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { applyTestEnv } from '../../helpers/env.js';

let createOauthState: () => string;
let buildGoogleAuthUrl: (state: string) => string;
let getGoogleUserFromCode: (code: string) => Promise<{ sub: string; email: string }>;

describe('lib/auth/oauth', () => {
  before(async () => {
    applyTestEnv();
    const mod = await import('../../../lib/auth/oauth.js');
    createOauthState = mod.createOauthState;
    buildGoogleAuthUrl = mod.buildGoogleAuthUrl;
    getGoogleUserFromCode = mod.getGoogleUserFromCode;
  });

  it('creates random oauth state tokens', () => {
    const stateA = createOauthState();
    const stateB = createOauthState();

    assert.match(stateA, /^[a-f0-9]+$/);
    assert.equal(stateA.length, 36);
    assert.notEqual(stateA, stateB);
  });

  it('builds the google auth URL with required params', () => {
    const url = new URL(buildGoogleAuthUrl('state-123'));

    assert.equal(url.origin, 'https://accounts.google.com');
    assert.equal(url.pathname, '/o/oauth2/v2/auth');
    assert.equal(url.searchParams.get('client_id'), 'test-google-client-id');
    assert.equal(url.searchParams.get('redirect_uri'), 'http://localhost:4000/auth/google/callback');
    assert.equal(url.searchParams.get('response_type'), 'code');
    assert.equal(url.searchParams.get('scope'), 'openid email profile');
    assert.equal(url.searchParams.get('state'), 'state-123');
  });

  it('exchanges auth codes and returns Google user info', async () => {
    const originalFetch = globalThis.fetch;
    const calls: string[] = [];

    globalThis.fetch = (async (input: URL | RequestInfo, init?: RequestInit) => {
      const url = String(input);
      calls.push(url);

      if (url === 'https://oauth2.googleapis.com/token') {
        assert.equal(init?.method, 'POST');
        return new Response(JSON.stringify({ access_token: 'token-123' }), { status: 200 });
      }

      if (url === 'https://openidconnect.googleapis.com/v1/userinfo') {
        assert.equal(init?.headers && (init.headers as Record<string, string>).Authorization, 'Bearer token-123');
        return new Response(JSON.stringify({ sub: 'google-user-1', email: 'user@example.com' }), { status: 200 });
      }

      return new Response('not found', { status: 404 });
    }) as typeof fetch;

    try {
      assert.deepEqual(await getGoogleUserFromCode('code-123'), { sub: 'google-user-1', email: 'user@example.com' });
      assert.deepEqual(calls, [
        'https://oauth2.googleapis.com/token',
        'https://openidconnect.googleapis.com/v1/userinfo',
      ]);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
