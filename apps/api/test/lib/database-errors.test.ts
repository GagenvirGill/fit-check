import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { isDatabaseUniqueViolation } from '../../lib/database-errors.js';

describe('lib/database-errors', () => {
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
