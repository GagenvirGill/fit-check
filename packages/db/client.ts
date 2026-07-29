import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";

import { dbSchema } from "./schema";

export function createDb(connectionString: string) {
  const pool = new pg.Pool({ connectionString });
  return drizzle(pool, { schema: dbSchema });
}
