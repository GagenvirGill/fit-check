import jwt from 'jsonwebtoken';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { envConfig } from '#lib/env-config';
import { cookieBaseOptions, OAUTH_STATE_COOKIE_NAME, SESSION_COOKIE_NAME, SESSION_TTL } from '#lib/auth/constants';

export type SessionPayload = {
  userId: string;
  email: string;
};

export const createSessionJwt = (payload: SessionPayload): string => {
  return jwt.sign(payload, envConfig.jwtSecret, {
    expiresIn: SESSION_TTL,
  });
};

export const setSessionCookie = (reply: FastifyReply, token: string) => {
  reply.setCookie(SESSION_COOKIE_NAME, token, {
    ...cookieBaseOptions,
    maxAge: SESSION_TTL,
  });
};

export const clearSessionCookie = (reply: FastifyReply) => {
  reply.clearCookie(SESSION_COOKIE_NAME, {
    ...cookieBaseOptions,
  });
};

export const setOauthStateCookie = (reply: FastifyReply, state: string) => {
  reply.setCookie(OAUTH_STATE_COOKIE_NAME, state, {
    ...cookieBaseOptions,
    maxAge: 300,
  });
};

export const consumeOauthStateCookie = (request: FastifyRequest, reply: FastifyReply): string | undefined => {
  const current = request.cookies[OAUTH_STATE_COOKIE_NAME];
  reply.clearCookie(OAUTH_STATE_COOKIE_NAME, {
    ...cookieBaseOptions,
  });
  return current;
};

export const readSession = (request: FastifyRequest): SessionPayload | null => {
  const token = request.cookies[SESSION_COOKIE_NAME];
  if (!token) {
    return null;
  }

  try {
    const decoded = jwt.verify(token, envConfig.jwtSecret);
    if (typeof decoded !== 'object' || decoded === null) {
      return null;
    }

    const userId = decoded.userId;
    const email = decoded.email;
    if (typeof userId !== 'string' || typeof email !== 'string') {
      return null;
    }

    return { userId, email };
  } catch {
    return null;
  }
};
