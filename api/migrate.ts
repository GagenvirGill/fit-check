import path from "node:path";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { createDb } from "#packages/db/client";

// Applies pending Drizzle migrations to DATABASE_URL. Deploys run the bundled
// dist/migrate.cjs on the server before restarting the API, so prod migrations
// never run from a dev machine. The build copies the migrations next to it.
async function main() {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) {
    throw new Error("Missing required environment variable: DATABASE_URL");
  }

  const db = createDb(databaseUrl);
  try {
    await migrate(db, { migrationsFolder: path.join(__dirname, "migrations") });
    process.stdout.write("Migrations applied\n");
  } finally {
    await db.$client.end();
  }
}

main().catch((error: unknown) => {
  // Drizzle wraps database errors, so the real reason is in `cause`.
  const cause =
    error instanceof Error && error.cause
      ? `\nCause: ${String(error.cause)}`
      : "";
  process.stderr.write(`Migration failed: ${String(error)}${cause}\n`);
  process.exit(1);
});
