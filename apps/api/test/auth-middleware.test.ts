import { before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { applyTestEnv } from './helpers/env.js';

type RequireAuth = (request: { cookies: Record<string, string>; authUser?: { userId: string; email: string } }, reply: {
  status: (code: number) => { send: (payload: unknown) => unknown };
}) => Promise<unknown>;

let requireAuth: RequireAuth;
let requireAuthUser: (request: { authUser?: { userId: string; email: string } }) => { userId: string; email: string };
let createSessionJwt: (payload: { userId: string; email: string }) => string;

describe('auth middleware', () => {
  before(async () => {
    applyTestEnv();
    const middleware = await import('../lib/auth/middleware.js');
    const session = await import('../lib/auth/session.js');
    requireAuth = middleware.requireAuth as RequireAuth;
    requireAuthUser = middleware.requireAuthUser as never;
    createSessionJwt = session.createSessionJwt;
  });

  it('requireAuthUser returns auth user when present', () => {
    const request = { authUser: { userId: 'user-1', email: 'user@example.com' } };
    const authUser = requireAuthUser(request);
    assert.equal(authUser.userId, 'user-1');
    assert.equal(authUser.email, 'user@example.com');
  });

  it('requireAuthUser throws when auth user missing', () => {
    assert.throws(() => requireAuthUser({}), /Unauthorized/);
  });

  it('requireAuth responds 401 with missing cookie', async () => {
    const request = { cookies: {} as Record<string, string> };
    const captured: { statusCode?: number; payload?: unknown } = {};
    const reply = {
      status: (code: number) => {
        captured.statusCode = code;
        return {
          send: (payload: unknown) => {
            captured.payload = payload;
            return payload;
          },
        };
      },
    };

    await requireAuth(request as never, reply as never);
    assert.equal(captured.statusCode, 401);
    assert.deepEqual(captured.payload, { success: false, message: 'Unauthorized' });
  });

  it('requireAuth sets request authUser for valid cookie', async () => {
    const token = createSessionJwt({ userId: 'user-1', email: 'user@example.com' });
    const request = { cookies: { fitcheck_session: token } as Record<string, string>, authUser: undefined };
    let wasSendCalled = false;
    const reply = {
      status: (_code: number) => ({
        send: (_payload: unknown) => {
          wasSendCalled = true;
          return null;
        },
      }),
    };

    await requireAuth(request as never, reply as never);
    assert.equal(wasSendCalled, false);
    assert.deepEqual(request.authUser, { userId: 'user-1', email: 'user@example.com' });
  });
});
