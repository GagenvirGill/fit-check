import path from 'node:path';
import { config } from 'dotenv';
import { defineConfig } from 'drizzle-kit';

config({
  path: path.resolve(process.cwd(), '../../.env'),
});

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('Missing required environment variable: DATABASE_URL');
}

export default defineConfig({
  schema: './schema.ts',
  out: './migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: databaseUrl,
  },
});
