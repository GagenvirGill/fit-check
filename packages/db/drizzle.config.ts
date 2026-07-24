import process from "node:process";
import { defineConfig } from "drizzle-kit";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("Missing required environment variable: DATABASE_URL");
}

export default defineConfig({
  schema: "./packages/db/schema.ts",
  out: "./packages/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: databaseUrl,
  },
});
