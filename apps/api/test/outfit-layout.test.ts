import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeLayout } from '../lib/outfit-layout.js';

describe('outfit layout normalization', () => {
  it('normalizes invalid layouts to an empty array', () => {
    assert.deepEqual(normalizeLayout(null), []);
    assert.deepEqual(normalizeLayout({}), []);
    assert.deepEqual(normalizeLayout('bad'), []);
  });

  it('retains valid rows and entries', () => {
    const layout = [
      [{ itemId: 'a', weight: 1 }, { itemId: 'b', weight: 2 }],
      [{ itemId: 'c', weight: 3 }],
    ];

    assert.deepEqual(normalizeLayout(layout), layout);
  });

  it('drops non-object entries and malformed rows safely', () => {
    const layout = [
      [{ itemId: 'x', weight: 1 }, null, 'oops'],
      'bad-row',
      [{ itemId: 'y' }],
    ];

    assert.deepEqual(normalizeLayout(layout), [
      [{ itemId: 'x', weight: 1 }],
      [],
      [{ itemId: 'y' }],
    ]);
  });
});
