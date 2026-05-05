import { before, beforeEach, describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';
import { S3Client } from '@aws-sdk/client-s3';
import { applyTestEnv } from '../helpers/env.js';

type CommandWithInput = {
  input: Record<string, unknown>;
};

let uploadItemImage: (filename: string, mimeType: string, bytes: Buffer) => Promise<string>;
let deleteItemImageByUrl: (imageUrl: string) => Promise<void>;
let commands: CommandWithInput[] = [];

void describe('lib/cloud-storage', () => {
  void before(async () => {
    applyTestEnv();
    mock.method(Date, 'now', () => 123);
    mock.method(Math, 'random', () => 0.5);
    mock.method(S3Client.prototype, 'send', async (command: unknown) => {
      commands.push(command as CommandWithInput);
      return {};
    });

    const mod = await import('../../lib/cloud-storage.js');
    uploadItemImage = mod.uploadItemImage as typeof uploadItemImage;
    deleteItemImageByUrl = mod.deleteItemImageByUrl as typeof deleteItemImageByUrl;
  });

  void beforeEach(() => {
    commands = [];
  });

  void it('uploads item images with a content-type derived extension', async () => {
    const url = await uploadItemImage('shirt.original', 'image/png', Buffer.from('image'));

    assert.equal(url, 'https://cdn.example.com/items/123-i.png');
    assert.deepEqual(commands[0].input, {
      Bucket: 'r2-bucket',
      Key: 'items/123-i.png',
      Body: Buffer.from('image'),
      ContentType: 'image/png',
    });
  });

  void it('falls back to the filename extension when the mime type is unknown', async () => {
    const url = await uploadItemImage('shirt.bmp', 'application/octet-stream', Buffer.from('image'));
    assert.equal(url, 'https://cdn.example.com/items/123-i.bmp');
    assert.equal(commands[0].input.Key, 'items/123-i.bmp');
  });

  void it('deletes item images whose URL belongs to the configured CDN base', async () => {
    await deleteItemImageByUrl('https://cdn.example.com/items/item-1.png');
    assert.deepEqual(commands[0].input, {
      Bucket: 'r2-bucket',
      Key: 'items/item-1.png',
    });
  });

  void it('ignores image URLs outside the configured CDN base', async () => {
    await deleteItemImageByUrl('https://other.example.com/items/item-1.png');
    assert.deepEqual(commands, []);
  });
});
