import { before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { applyTestEnv } from '../helpers/env.js';

let validateImageUpload: (mimeType: string, bytes: Buffer) =>
  { ok: true; normalizedMimeType: string } | { ok: false; message: string };

void describe('lib/image-validation', () => {
  void before(async () => {
    applyTestEnv();
    const mod = await import('../../lib/image-validation.js');
    validateImageUpload = mod.validateImageUpload as typeof validateImageUpload;
  });

  void it('accepts png when magic bytes match', () => {
    const png = Buffer.from('89504e470d0a1a0a00000000', 'hex');

    assert.deepEqual(validateImageUpload('image/png', png), {
      ok: true,
      normalizedMimeType: 'image/png',
    });
  });

  void it('rejects unsupported content types', () => {
    const response = validateImageUpload('text/plain', Buffer.from('hello'));
    assert.deepEqual(response, {
      ok: false,
      message: 'Unsupported image content type',
    });

    const jpeg = Buffer.from('ffd8ffe000104a46', 'hex');
    assert.deepEqual(validateImageUpload('image/jpeg', jpeg), {
      ok: false,
      message: 'Unsupported image content type',
    });
  });

  void it('rejects png mime type when content is not png', () => {
    const response = validateImageUpload('image/png', Buffer.from('not-a-png'));
    assert.deepEqual(response, {
      ok: false,
      message: 'Uploaded file is not a valid supported image',
    });
  });
});
