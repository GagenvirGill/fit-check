import { before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { applyTestEnv } from '../helpers/env.js';

let parseCategoryIdsBody: (body: unknown) => string[] | undefined;

void describe('routes/items parseCategoryIdsBody', () => {
  void before(async () => {
    applyTestEnv();
    const mod = await import('../../routes/items.js');
    parseCategoryIdsBody = mod.parseCategoryIdsBody;
  });

  void it('returns undefined when categoryIds is omitted', () => {
    assert.equal(parseCategoryIdsBody({}), undefined);
  });

  void it('parses and dedupes categoryIds', () => {
    assert.deepEqual(parseCategoryIdsBody({ categoryIds: [] }), []);
    assert.deepEqual(parseCategoryIdsBody({ categoryIds: ['cat-1', 'cat-2'] }), ['cat-1', 'cat-2']);
    assert.deepEqual(parseCategoryIdsBody({ categoryIds: ['cat-1', 'cat-1', 'cat-2'] }), ['cat-1', 'cat-2']);
  });

  void it('throws status-coded errors for invalid categoryIds shapes', () => {
    assert.throws(() => parseCategoryIdsBody({ categoryIds: 'bad' }), /categoryIds must be an array/);
    assert.throws(() => parseCategoryIdsBody({ categoryIds: ['ok', ''] }), /categoryIds must contain non-empty string IDs/);
    assert.throws(() => parseCategoryIdsBody({ categoryIds: ['ok', 123] }), /categoryIds must contain non-empty string IDs/);
  });
});
