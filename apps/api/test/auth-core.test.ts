import { before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { applyTestEnv } from './helpers/env.js';

let createSessionJwt: (payload: { userId: string; email: string }) => string;
let readSession: (request: { cookies: Record<string, string> }) => { userId: string; email: string };

describe('auth core session utilities', () => {
  before(async () => {
    applyTestEnv();
    const mod = await import('../lib/auth/session.js');
    createSessionJwt = mod.createSessionJwt;
    readSession = mod.readSession as never;
  });

  it('reads a valid session token payload', () => {
    const token = createSessionJwt({ userId: 'user-1', email: 'user@example.com' });
    const session = readSession({ cookies: { fitcheck_session: token } } as never);

    assert.equal(session.userId, 'user-1');
    assert.equal(session.email, 'user@example.com');
  });

  it('throws unauthorized for invalid token', () => {
    const session = readSession({ cookies: { fitcheck_session: 'invalid' } } as never);
    assert.equal(session, null);
  });
});
