import { eq } from "drizzle-orm";

import type { AuthUser } from "#packages/contracts/auth";
import { dbSchema } from "#packages/db/schema";
import { db } from "../db";

export async function upsertOAuthUser(
  input: { provider: string; providerId: string; email: string },
): Promise<AuthUser> {
  const [row] = await db
    .insert(dbSchema.user)
    .values(input)
    .onConflictDoUpdate({
      target: dbSchema.user.providerId,
      set: {
        email: input.email,
        provider: input.provider,
        updatedAt: new Date(),
      },
    })
    .returning();

  return toAuthUser(row);
}

export async function getUserById(userId: string): Promise<AuthUser | null> {
  const [row] = await db
    .select()
    .from(dbSchema.user)
    .where(eq(dbSchema.user.userId, userId))
    .limit(1);

  return row ? toAuthUser(row) : null;
}

function toAuthUser(row: { userId: string; email: string; provider: string }): AuthUser {
  return {
    userId: row.userId,
    email: row.email,
    provider: row.provider,
  };
}
