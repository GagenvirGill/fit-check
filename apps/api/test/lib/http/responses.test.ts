import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { created, ok, sendFailure } from '../../../lib/http/responses.js';

type CapturedReply = {
  statusCode?: number;
  payload?: unknown;
  status: (statusCode: number) => { send: (payload: unknown) => unknown };
};

const createReply = (): CapturedReply => {
  const reply: CapturedReply = {
    status: (statusCode: number) => {
      reply.statusCode = statusCode;
      return {
        send: (payload: unknown) => {
          reply.payload = payload;
          return payload;
        },
      };
    },
  };
  return reply;
};

describe('lib/http/responses', () => {
  it('sends success responses with optional data', () => {
    const reply = createReply();
    ok(reply as never, 'Loaded', { count: 1 });

    assert.equal(reply.statusCode, 200);
    assert.deepEqual(reply.payload, { success: true, message: 'Loaded', data: { count: 1 } });
  });

  it('sends created responses without undefined data', () => {
    const reply = createReply();
    created(reply as never, 'Created');

    assert.equal(reply.statusCode, 201);
    assert.deepEqual(reply.payload, { success: true, message: 'Created' });
  });

  it('sends failure responses', () => {
    const reply = createReply();
    sendFailure(reply as never, 409, 'Conflict');

    assert.equal(reply.statusCode, 409);
    assert.deepEqual(reply.payload, { success: false, message: 'Conflict' });
  });
});
