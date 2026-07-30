import { createDb } from "#packages/db/client";
import { env } from "./get-env";

export const dbClient = createDb(env.databaseUrl);
