import { createDb } from '@fit-check/database/client';
import { envConfig } from '#lib/env-config';

const db = createDb(envConfig.databaseUrl);

export default db;
