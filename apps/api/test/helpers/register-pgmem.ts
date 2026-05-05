import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import pg from 'pg';
import { applyIntegrationsToPool } from 'drizzle-pgmem';
import { DataType, newDb } from 'pg-mem';

type PoolCtor = typeof pg.Pool;

const originalPool = pg.Pool as PoolCtor;
const memPools = new Map<string, InstanceType<PoolCtor>>();

const createMemPool = () => {
  const mem = newDb({ autoCreateForeignKeyIndices: true });
  mem.public.registerFunction({
    name: 'gen_random_uuid',
    returns: DataType.uuid,
    implementation: () => randomUUID(),
  });

  const dirname = path.dirname(fileURLToPath(import.meta.url));
  const migrationsDir = path.resolve(dirname, '../../../database/migrations');
  const migrationFiles = fs
    .readdirSync(migrationsDir)
    .filter((file) => /^\d+.*\.sql$/.test(file))
    .sort();

  for (const file of migrationFiles) {
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    const statements = sql
      .split('--> statement-breakpoint')
      .map((statement) => statement.trim())
      .filter((statement) => statement.length > 0);

    for (const statement of statements) {
      mem.public.none(statement);
    }
  }

  const pgAdapter = mem.adapters.createPg();
  const pool = new pgAdapter.Pool();
  applyIntegrationsToPool(pool);
  return pool as unknown as InstanceType<PoolCtor>;
};

class TestAwarePool {
  constructor(config?: ConstructorParameters<PoolCtor>[0]) {
    const connectionString =
      typeof config === 'object' && config && 'connectionString' in config
        ? String(config.connectionString ?? '')
        : '';

    if (connectionString.startsWith('pgmem://')) {
      const existing = memPools.get(connectionString);
      if (existing) {
        return existing;
      }
      const created = createMemPool();
      memPools.set(connectionString, created);
      return created;
    }

    return new originalPool(config);
  }
}

pg.Pool = TestAwarePool as unknown as PoolCtor;
