import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { env } from "./get-env";

const S3_OBJECT_CACHE_CONTROL = "public, max-age=31536000, immutable";

const s3Client = new S3Client({
  region: env.s3Region,
});

export type S3ObjectInput = {
  key: string;
  body: Buffer;
  contentType: string;
};

export async function uploadS3Object(input: S3ObjectInput): Promise<void> {
  await s3Client.send(
    new PutObjectCommand({
      Bucket: env.s3Bucket,
      Key: input.key,
      Body: input.body,
      ContentType: input.contentType,
      CacheControl: S3_OBJECT_CACHE_CONTROL,
    }),
  );
}

export async function deleteS3Object(key: string): Promise<void> {
  await s3Client.send(
    new DeleteObjectCommand({
      Bucket: env.s3Bucket,
      Key: key,
    }),
  );
}
