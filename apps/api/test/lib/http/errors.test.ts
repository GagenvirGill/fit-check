import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { badRequest, conflict, getErrorMessage, getHttpStatusCode, notFound, unauthorized } from '../../../lib/http/errors.js';

describe('lib/http/errors', () => {
  it('creates typed http errors', () => {
    assert.equal(badRequest('Bad').statusCode, 400);
    assert.equal(unauthorized().statusCode, 401);
    assert.equal(notFound('Missing').statusCode, 404);
    assert.equal(conflict('Conflict').statusCode, 409);
  });

  it('reads status codes and messages safely', () => {
    assert.equal(getHttpStatusCode({ statusCode: 418 }), 418);
    assert.equal(getHttpStatusCode({ statusCode: 302 }), null);
    assert.equal(getHttpStatusCode(null), null);
    assert.equal(getErrorMessage(new Error('Boom')), 'Boom');
    assert.equal(getErrorMessage('bad', 'Fallback'), 'Fallback');
  });
});
