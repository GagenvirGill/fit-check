import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import type { PoolConfig } from "pg";

import { dbSchema } from "./schema";

export type DbPool = pg.Pool;
export type DbPoolConfig = Omit<PoolConfig, "connectionString">;

export function createDbPool(connectionString: string, poolConfig: DbPoolConfig = {}) {
  return new pg.Pool({ ...poolConfig, connectionString });
}

export function createDbFromPool(pool: DbPool) {
  return drizzle(pool, { schema: dbSchema });
}

export function createDb(connectionString: string, poolConfig?: DbPoolConfig) {
  return createDbFromPool(createDbPool(connectionString, poolConfig));
}

export type Db = ReturnType<typeof createDb>;
