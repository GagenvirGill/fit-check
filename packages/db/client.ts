import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";

import { dbSchema } from "./schema";

export function createDb(connectionString: string) {
  // Postgres shares a small server with the API, so keep the pool small.
  const pool = new pg.Pool({ connectionString, max: 5 });
  return drizzle(pool, { schema: dbSchema });
}
