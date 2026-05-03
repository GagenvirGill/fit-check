import type { FastifyPluginAsync } from 'fastify';
import { envConfig } from '../lib/env-config';
import { getUserById, upsertGoogleUser } from '../services/users';
import { buildGoogleAuthUrl, createOauthState, getGoogleUserFromCode } from '../lib/auth/oauth';
import {
  clearSessionCookie,
  consumeOauthStateCookie,
  createSessionJwt,
  readSession,
  setOauthStateCookie,
  setSessionCookie,
} from '../lib/auth/session';

const authRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/google', async (_request, reply) => {
    const state = createOauthState();
    setOauthStateCookie(reply, state);
    reply.redirect(buildGoogleAuthUrl(state));
  });

  fastify.get('/google/callback', async (request, reply) => {
    const code = (request.query as { code?: string }).code;
    const returnedState = (request.query as { state?: string }).state;
    if (!code || !returnedState) {
      return reply.status(400).send({ success: false, message: 'Google callback payload is invalid' });
    }

    const expectedState = consumeOauthStateCookie(request, reply);
    if (!expectedState || expectedState !== returnedState) {
      return reply.status(401).send({ success: false, message: 'OAuth state validation failed' });
    }

    const googleUser = await getGoogleUserFromCode(code);
    const appUser = await upsertGoogleUser(googleUser.sub, googleUser.email);

    const sessionToken = createSessionJwt({
      userId: appUser.userId,
      email: appUser.email,
    });

    setSessionCookie(reply, sessionToken);
    reply.redirect(envConfig.frontendUrl);
  });

  fastify.get('/me', async (request, reply) => {
    const session = readSession(request);
    if (!session) {
      return reply.status(401).send({ success: false, message: 'Unauthorized' });
    }

    const user = await getUserById(session.userId);
    if (!user) {
      return reply.status(401).send({ success: false, message: 'Unauthorized' });
    }

    return reply.status(200).send({
      success: true,
      message: 'Authenticated user',
      data: user,
    });
  });

  fastify.post('/logout', async (_request, reply) => {
    clearSessionCookie(reply);
    return reply.status(200).send({ success: true, message: 'Logged out' });
  });
};

export default authRoutes;
