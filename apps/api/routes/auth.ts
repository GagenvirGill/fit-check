import type { FastifyPluginAsync } from 'fastify';
import type { GoogleCallbackQuery } from '@fit-check/shared/types/contracts/auth';
import { googleCallbackQuerySchema } from '@fit-check/shared/types/contracts/auth';
import { envConfig } from '#lib/env-config';
import { getUserById, upsertGoogleUser } from '#lib/database/queries/users';
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

  fastify.get('/google/callback', { schema: { querystring: googleCallbackQuerySchema } }, async (request, reply) => {
    const { code, state: returnedState } = request.query as GoogleCallbackQuery;
    const expectedState = consumeOauthStateCookie(request, reply);
    if (!expectedState || expectedState !== returnedState) {
      throw new Error('OAuth state validation failed');
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
      throw new Error('Unauthorized');
    }

    const user = await getUserById(session.userId);
    if (!user) {
      throw new Error('Unauthorized');
    }

    return reply.status(200).send({
      success: true,
      message: 'Authenticated user',
      data: user,
    });
  });

  fastify.post('/logout', async (_request, reply) => {
    clearSessionCookie(reply);
    return reply.status(200).send({
      success: true,
      message: 'Logged out',
    });
  });
};

export default authRoutes;
