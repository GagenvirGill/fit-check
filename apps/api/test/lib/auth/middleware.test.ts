import { before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { applyTestEnv } from '../../helpers/env.js';

type RequireAuth = (request: { cookies: Record<string, string>; authUser?: { userId: string; email: string } }, reply: {
  status: (code: number) => { send: (payload: unknown) => unknown };
}) => Promise<unknown>;

let requireAuth: RequireAuth;
let createSessionJwt: (payload: { userId: string; email: string }) => string;

void describe('lib/auth/middleware', () => {
  void before(async () => {
    applyTestEnv();
    const middleware = await import('../../../lib/auth/middleware.js');
    const session = await import('../../../lib/auth/session.js');
    requireAuth = middleware.requireAuth as RequireAuth;
    createSessionJwt = session.createSessionJwt;
  });

  void it('responds 401 for missing or invalid session cookies', async () => {
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

    await requireAuth({ cookies: {} }, reply);
    assert.equal(captured.statusCode, 401);
    assert.deepEqual(captured.payload, { message: 'Unauthorized' });
  });

  void it('sets request.authUser for valid session cookies', async () => {
    const token = createSessionJwt({ userId: 'user-1', email: 'user@example.com' });
    const request = { cookies: { fitcheck_session: token }, authUser: undefined };
    let wasSendCalled = false;

    await requireAuth(request, {
      status: () => ({
        send: () => {
          wasSendCalled = true;
          return null;
        },
      }),
    });

    assert.equal(wasSendCalled, false);
    assert.deepEqual(request.authUser, { userId: 'user-1', email: 'user@example.com' });
  });
});
