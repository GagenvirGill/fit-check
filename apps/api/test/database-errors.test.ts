import { before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { applyTestEnv } from './helpers/env.js';

let isDatabaseUniqueViolation: (error: unknown) => boolean;

describe('database error helpers', () => {
  before(async () => {
    applyTestEnv();
    const mod = await import('../lib/database-errors.js');
    isDatabaseUniqueViolation = mod.isDatabaseUniqueViolation;
  });

  it('identifies postgres unique-violation errors', () => {
    assert.equal(isDatabaseUniqueViolation({ code: '23505' }), true);
  });

  it('returns false for non-unique or malformed errors', () => {
    assert.equal(isDatabaseUniqueViolation({ code: '22001' }), false);
    assert.equal(isDatabaseUniqueViolation({}), false);
    assert.equal(isDatabaseUniqueViolation(null), false);
    assert.equal(isDatabaseUniqueViolation('error'), false);
  });
});
