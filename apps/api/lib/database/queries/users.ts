import { and, eq } from 'drizzle-orm';
import * as schema from '@fit-check/database/schema';
import db from '../client';

export const upsertGoogleUser = async (providerId: string, email: string) => {
  const existing = await db
    .select()
    .from(schema.user)
    .where(and(eq(schema.user.provider, 'google'), eq(schema.user.providerId, providerId)))
    .limit(1);

  if (existing[0]) {
    if (existing[0].email !== email) {
      await db.update(schema.user).set({ email }).where(eq(schema.user.userId, existing[0].userId));
      return {
        ...existing[0],
        email,
      };
    }
    return existing[0];
  }

  const inserted = await db
    .insert(schema.user)
    .values({
      provider: 'google',
      providerId,
      email,
    })
    .returning();

  return inserted[0];
};

export const getUserById = async (userId: string) => {
  const user = await db
    .select({
      userId: schema.user.userId,
      email: schema.user.email,
      provider: schema.user.provider,
    })
    .from(schema.user)
    .where(eq(schema.user.userId, userId))
    .limit(1);

  return user[0] ?? null;
};
