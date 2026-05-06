import path from 'node:path';
import { config } from 'dotenv';

import type { AppRuntimeEnv } from '@fit-check/shared/lib/runtime-env';
import { validateAppRuntimeEnv } from '@fit-check/shared/lib/runtime-env';

config({
  path: path.resolve(process.cwd(), '../../.env'),
});

const parseNumberStrict = (name: string, raw: string): number => {
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) {
    throw new Error(`Environment variable ${name} must be a valid number`);
  }

  return parsed;
};

const get = {
  string(name: string, fallback?: string): string {
    const value = process.env[name];
    if (value === undefined || value === '') {
      if (fallback !== undefined) {
        return fallback;
      }
      throw new Error(`Missing required environment variable: ${name}`);
    }

    return value;
  },
  number(name: string, fallback?: number): number {
    const value = process.env[name];
    if (value === undefined || value === '') {
      if (fallback !== undefined) {
        return fallback;
      }
      throw new Error(`Missing required environment variable: ${name}`);
    }

    return parseNumberStrict(name, value);
  },
};

const parseRuntimeEnv = (): AppRuntimeEnv => {
  return validateAppRuntimeEnv(get.string('NODE_ENV', 'development'));
};

export const envConfig = {
  nodeEnv: parseRuntimeEnv(),
  port: get.number('SERVER_PORT', 4000),
  databaseUrl: get.string('DATABASE_URL'),
  frontendUrl: get.string('FRONTEND_URL'),
  jwtSecret: get.string('JWT_SECRET'),
  googleClientId: get.string('GOOGLE_CLIENT_ID'),
  googleClientSecret: get.string('GOOGLE_CLIENT_SECRET'),
  googleCallbackUrl: get.string('GOOGLE_CALLBACK_URL'),
  r2AccessKeyId: get.string('R2_ACCESS_KEY_ID'),
  r2SecretAccessKey: get.string('R2_SECRET_ACCESS_KEY'),
  r2BucketName: get.string('R2_BUCKET_NAME'),
  r2AccountId: get.string('R2_ACCOUNT_ID'),
  r2Region: get.string('R2_REGION'),
  r2PublicUrl: get.string('R2_PUBLIC_URL'),
};

export const isProduction = envConfig.nodeEnv === 'production';
