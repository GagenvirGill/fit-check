import { randomUUID } from "node:crypto";
import path from "node:path";

import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { imageSize } from "image-size";

import { getEnv } from "./get-env";

const env = getEnv();
const s3 = new S3Client({
  region: env.s3Region,
});

export type UploadedItemImage = {
  fileName: string;
  mimeType: string;
  bytes: Buffer;
};

export type StoredItemImage = {
  imagePath: string;
  imageWidth: number;
  imageHeight: number;
};

export async function uploadItemImage(userId: string, image: UploadedItemImage): Promise<StoredItemImage | null> {
  const dimensions = imageSize(image.bytes);
  if (!dimensions.width || !dimensions.height) {
    return null;
  }

  const imagePath = `users/${userId}/items/${randomUUID()}-${safeFileName(image.fileName)}`;

  await s3.send(new PutObjectCommand({
    Bucket: env.s3Bucket,
    Key: imagePath,
    Body: image.bytes,
    ContentType: image.mimeType,
  }));

  return {
    imagePath,
    imageWidth: dimensions.width,
    imageHeight: dimensions.height,
  };
}

function safeFileName(fileName: string): string {
  const parsed = path.basename(fileName).replace(/[^a-zA-Z0-9._-]/g, "-");
  return parsed.length > 0 ? parsed : "upload";
}
