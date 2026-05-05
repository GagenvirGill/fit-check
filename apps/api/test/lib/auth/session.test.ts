import { before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { applyTestEnv } from '../../helpers/env.js';

let createSessionJwt: (payload: { userId: string; email: string }) => string;
let readSession: (request: { cookies: Record<string, string> }) => { userId: string; email: string } | null;
let setSessionCookie: (reply: { setCookie: (name: string, value: string, options: object) => void }, token: string) => void;
let clearSessionCookie: (reply: { clearCookie: (name: string, options: object) => void }) => void;
let setOauthStateCookie: (reply: { setCookie: (name: string, value: string, options: object) => void }, state: string) => void;
let consumeOauthStateCookie: (
  request: { cookies: Record<string, string> },
  reply: { clearCookie: (name: string, options: object) => void },
) => string | undefined;

void describe('lib/auth/session', () => {
  void before(async () => {
    applyTestEnv();
    const mod = await import('../../../lib/auth/session.js');
    createSessionJwt = mod.createSessionJwt;
    readSession = mod.readSession as typeof readSession;
    setSessionCookie = mod.setSessionCookie as typeof setSessionCookie;
    clearSessionCookie = mod.clearSessionCookie as typeof clearSessionCookie;
    setOauthStateCookie = mod.setOauthStateCookie as typeof setOauthStateCookie;
    consumeOauthStateCookie = mod.consumeOauthStateCookie as typeof consumeOauthStateCookie;
  });

  void it('reads a valid session token payload', () => {
    const token = createSessionJwt({ userId: 'user-1', email: 'user@example.com' });
    assert.deepEqual(readSession({ cookies: { fitcheck_session: token } }), {
      userId: 'user-1',
      email: 'user@example.com',
    });
  });

  void it('returns null for missing, invalid, or malformed session tokens', () => {
    assert.equal(readSession({ cookies: {} }), null);
    assert.equal(readSession({ cookies: { fitcheck_session: 'invalid' } }), null);
  });

  void it('sets and clears session cookies', () => {
    const setCalls: unknown[] = [];
    const clearCalls: unknown[] = [];

    setSessionCookie({ setCookie: (...args: unknown[]) => setCalls.push(args) }, 'token-1');
    clearSessionCookie({ clearCookie: (...args: unknown[]) => clearCalls.push(args) });

    assert.equal((setCalls[0] as unknown[])[0], 'fitcheck_session');
    assert.equal((setCalls[0] as unknown[])[1], 'token-1');
    assert.equal((clearCalls[0] as unknown[])[0], 'fitcheck_session');
  });

  void it('sets and consumes oauth state cookies', () => {
    const setCalls: unknown[] = [];
    const clearCalls: unknown[] = [];

    setOauthStateCookie({ setCookie: (...args: unknown[]) => setCalls.push(args) }, 'state-1');
    const state = consumeOauthStateCookie(
      { cookies: { fitcheck_oauth_state: 'state-1' } },
      { clearCookie: (...args: unknown[]) => clearCalls.push(args) },
    );

    assert.equal(state, 'state-1');
    assert.equal((setCalls[0] as unknown[])[0], 'fitcheck_oauth_state');
    assert.equal((clearCalls[0] as unknown[])[0], 'fitcheck_oauth_state');
  });
});
