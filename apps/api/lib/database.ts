import { createDb } from '@fit-check/database/client';
import { envConfig } from './env-config';

const db = createDb(envConfig.databaseUrl);

export default db;
