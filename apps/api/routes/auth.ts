import type { FastifyPluginAsync } from 'fastify';
import type {
  AuthMeResponse,
  GoogleCallbackQuery,
} from '@fit-check/shared/types/contracts/auth';
import { googleCallbackQuerySchema } from '@fit-check/shared/types/contracts/auth';
import { envConfig } from '#lib/env-config';
import { getUserById, upsertGoogleUser } from '#lib/database/queries/users';
import { buildGoogleAuthUrl, createOauthState, getGoogleUserFromCode, OauthProviderError } from '#lib/auth/oauth';
import {
  clearSessionCookie,
  consumeOauthStateCookie,
  createSessionJwt,
  readSession,
  setOauthStateCookie,
  setSessionCookie,
} from '#lib/auth/session';
import { isDatabaseQueryError } from '#lib/database/query-error';

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
      return reply.status(400).send({ message: 'OAuth state validation failed' });
    }

    try {
      const googleUser = await getGoogleUserFromCode(code);
      const appUser = await upsertGoogleUser(googleUser.sub, googleUser.email);

      const sessionToken = createSessionJwt({
        userId: appUser.userId,
        email: appUser.email,
      });

      setSessionCookie(reply, sessionToken);
      return reply.redirect(envConfig.frontendUrl);
    } catch (error) {
      if (error instanceof OauthProviderError) {
        return reply.status(502).send({ message: 'OAuth provider request failed' });
      }

      if (isDatabaseQueryError(error)) {
        return reply.status(error.statusCode).send({ message: error.message });
      }

      throw error;
    }
  });

  fastify.get('/me', async (request, reply) => {
    const session = readSession(request);
    if (!session) {
      return reply.status(401).send({ message: 'Unauthorized' });
    }

    const user = await getUserById(session.userId);
    if (!user) {
      return reply.status(401).send({ message: 'Unauthorized' });
    }

    const body: AuthMeResponse = user;
    return reply.status(200).send(body);
  });

  fastify.post('/logout', async (_request, reply) => {
    clearSessionCookie(reply);
    return reply.status(204).send();
  });
};

export default authRoutes;
