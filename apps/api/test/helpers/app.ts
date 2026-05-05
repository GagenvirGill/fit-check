import assert from 'node:assert/strict';
import type { FastifyInstance, LightMyRequestResponse } from 'fastify';
import { applyTestEnv } from './env.js';

export const createTestApp = async (): Promise<FastifyInstance> => {
  applyTestEnv();
  const { createApp } = await import('../../app.js');
  return createApp();
};

export const createAuthCookie = async (
  user = { userId: '11111111-1111-1111-1111-111111111111', email: 'user@example.com' },
): Promise<string> => {
  applyTestEnv();
  const { createSessionJwt } = await import('../../lib/auth/session.js');
  const token = createSessionJwt(user);
  return `fitcheck_session=${token}`;
};

export const expectValidationError = (response: LightMyRequestResponse) => {
  assert.equal(response.statusCode, 400);
  const payload = response.json();
  assert.equal(typeof payload.message, 'string');
  assert.ok(payload.message.length > 0);
};

export const multipartBody = (fieldName: string, filename: string, contentType: string, content: string) => {
  const boundary = '----fit-check-test-boundary';
  const payload = [
    `--${boundary}`,
    `Content-Disposition: form-data; name="${fieldName}"; filename="${filename}"`,
    `Content-Type: ${contentType}`,
    '',
    content,
    `--${boundary}--`,
    '',
  ].join('\r\n');

  return {
    payload,
    headers: {
      'content-type': `multipart/form-data; boundary=${boundary}`,
    },
  };
};
