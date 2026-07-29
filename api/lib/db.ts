import { createDb } from "#packages/db/client";
import { getEnv } from "./get-env";

export const db = createDb(getEnv().databaseUrl);
