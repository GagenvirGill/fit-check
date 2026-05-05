import { before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { applyTestEnv } from '../helpers/env.js';

let parseCategoryFilter: (raw?: string) => string[];
let parseCategoryIdsBody: (body: unknown) => string[];

describe('services/items', () => {
  before(async () => {
    applyTestEnv();
    const mod = await import('../../services/items.js');
    parseCategoryFilter = mod.parseCategoryFilter;
    parseCategoryIdsBody = mod.parseCategoryIdsBody;
  });

  it('parses category query filters safely', () => {
    assert.deepEqual(parseCategoryFilter(undefined), []);
    assert.deepEqual(parseCategoryFilter(''), []);
    assert.deepEqual(parseCategoryFilter('a,b,c'), ['a', 'b', 'c']);
    assert.deepEqual(parseCategoryFilter(' a ,  b ,, c  '), ['a', 'b', 'c']);
  });

  it('parses and dedupes category id bodies', () => {
    assert.deepEqual(parseCategoryIdsBody({ categories: [] }), []);
    assert.deepEqual(parseCategoryIdsBody({ categories: ['cat-1', 'cat-2'] }), ['cat-1', 'cat-2']);
    assert.deepEqual(parseCategoryIdsBody({ categories: ['cat-1', 'cat-1', 'cat-2'] }), ['cat-1', 'cat-2']);
  });

  it('throws status-coded errors for invalid category body shapes', () => {
    assert.throws(() => parseCategoryIdsBody({}), /categories must be provided/);
    assert.throws(() => parseCategoryIdsBody({ categories: 'bad' }), /categories must be an array/);
    assert.throws(() => parseCategoryIdsBody({ categories: ['ok', ''] }), /categories must contain non-empty string IDs/);
    assert.throws(() => parseCategoryIdsBody({ categories: ['ok', 123] }), /categories must contain non-empty string IDs/);
  });
});
