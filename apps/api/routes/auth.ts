import type { FastifyPluginAsync } from 'fastify';
import { envConfig } from '#lib/env-config';
import { getUserById, upsertGoogleUser } from '#lib/database/queries/users';
import { unauthorized } from '#lib/http/errors';
import { ok } from '#lib/http/responses';
import { googleCallbackQuerySchema, routeSchema } from '#lib/http/schemas';
import { buildGoogleAuthUrl, createOauthState, getGoogleUserFromCode } from '#lib/auth/oauth';
import {
  clearSessionCookie,
  consumeOauthStateCookie,
  createSessionJwt,
  readSession,
  setOauthStateCookie,
  setSessionCookie,
} from '#lib/auth/session';

const authRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/google', async (_request, reply) => {
    const state = createOauthState();
    setOauthStateCookie(reply, state);
    return reply.redirect(buildGoogleAuthUrl(state));
  });

  fastify.get('/google/callback', routeSchema({
    querystring: googleCallbackQuerySchema,
  }), async (request, reply) => {
    const { code, state: returnedState } = request.query as { code: string; state: string };
    const expectedState = consumeOauthStateCookie(request, reply);
    if (!expectedState || expectedState !== returnedState) {
      throw unauthorized('OAuth state validation failed');
    }

    const googleUser = await getGoogleUserFromCode(code);
    const appUser = await upsertGoogleUser(googleUser.sub, googleUser.email);

    const sessionToken = createSessionJwt({
      userId: appUser.userId,
      email: appUser.email,
    });

    setSessionCookie(reply, sessionToken);
    return reply.redirect(envConfig.frontendUrl);
  });

  fastify.get('/me', async (request, reply) => {
    const session = readSession(request);
    if (!session) {
      throw unauthorized();
    }

    const user = await getUserById(session.userId);
    if (!user) {
      throw unauthorized();
    }

    return ok(reply, 'Authenticated user', user);
  });

  fastify.post('/logout', async (_request, reply) => {
    clearSessionCookie(reply);
    return ok(reply, 'Logged out');
  });
};

export default authRoutes;
