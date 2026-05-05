import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { extname } from 'node:path';
import { envConfig } from '#lib/env-config';

const r2Client = new S3Client({
  region: envConfig.r2Region,
  endpoint: `https://${envConfig.r2AccountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: envConfig.r2AccessKeyId,
    secretAccessKey: envConfig.r2SecretAccessKey,
  },
});

export const uploadItemImage = async (filename: string, mimeType: string, bytes: Buffer): Promise<string> => {
  const extFromMime: Record<string, string> = {
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
    'image/gif': '.gif',
    'image/avif': '.avif',
  };
  const extension = extFromMime[mimeType] ?? (extname(filename) || '.jpg');
  const key = `items/${Date.now()}-${Math.random().toString(36).slice(2)}${extension}`;

  await r2Client.send(new PutObjectCommand({
    Bucket: envConfig.r2BucketName,
    Key: key,
    Body: bytes,
    ContentType: mimeType,
  }));

  return `${envConfig.r2Url}/${key}`;
};

export const deleteItemImageByUrl = async (imageUrl: string): Promise<void> => {
  const normalizedBase = envConfig.r2Url.replace(/\/$/, '');
  const key = imageUrl.replace(`${normalizedBase}/`, '');
  if (!key || key === imageUrl) {
    return;
  }

  await r2Client.send(new DeleteObjectCommand({
    Bucket: envConfig.r2BucketName,
    Key: key,
  }));
};
