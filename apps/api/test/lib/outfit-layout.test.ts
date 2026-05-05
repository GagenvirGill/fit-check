import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getUniqueLayoutItemIds, isValidLayout, normalizeLayout } from '../../lib/outfit-layout.js';

describe('lib/outfit-layout', () => {
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
    assert.equal(isValidLayout(layout), true);
  });

  it('drops malformed rows and entries during normalization', () => {
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
    assert.equal(isValidLayout(layout), false);
  });

  it('collects unique item ids from a valid layout', () => {
    assert.deepEqual(getUniqueLayoutItemIds([
      [{ itemId: 'item-1', weight: 1 }, { itemId: 'item-2', weight: 1 }],
      [{ itemId: 'item-1', weight: 3 }],
    ]), ['item-1', 'item-2']);
  });
});
