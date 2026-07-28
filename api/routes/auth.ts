import type { FastifyPluginAsync } from "fastify";

import type { ApiConfig } from "../config";
import {
  clearOauthStateCookie,
  clearSessionCookie,
  getOauthStateCookie,
  getSessionCookie,
  setOauthStateCookie,
  setSessionCookie,
} from "../lib/auth/cookies";
import { unauthorizedError } from "../lib/auth/current-user";
import { ApiError } from "../lib/http/api-error";
import type { ApiServices } from "../services";

type AuthRouteOptions = {
  services: ApiServices;
  config: ApiConfig;
};

type GoogleCallbackQuery = {
  code?: string;
  state?: string;
};

const authRoutes: FastifyPluginAsync<AuthRouteOptions> = async (fastify, options) => {
  fastify.get("/google", async (_request, reply) => {
    const state = options.services.auth.createOauthState();
    setOauthStateCookie(reply, options.config, state);
    return reply.redirect(options.services.auth.buildGoogleAuthUrl(state));
  });

  fastify.get<{ Querystring: GoogleCallbackQuery }>("/google/callback", async (request, reply) => {
    const expectedState = getOauthStateCookie(request, options.config);
    clearOauthStateCookie(reply, options.config);

    if (!request.query.code || !request.query.state || !expectedState || request.query.state !== expectedState) {
      throw new ApiError(400, "OAuth state validation failed");
    }

    const user = await options.services.auth.exchangeGoogleCode(request.query.code);
    const sessionId = await options.services.auth.createSession(user.userId);
    setSessionCookie(reply, options.config, sessionId);
    return reply.redirect(options.config.frontendUrl);
  });

  fastify.get("/me", async (request, reply) => {
    const sessionId = getSessionCookie(request, options.config);
    if (!sessionId) {
      throw unauthorizedError();
    }

    const user = await options.services.auth.getSessionUser(sessionId);
    if (!user) {
      throw unauthorizedError();
    }

    return reply.status(200).send(user);
  });

  fastify.post("/logout", async (request, reply) => {
    const sessionId = getSessionCookie(request, options.config);
    if (sessionId) {
      await options.services.auth.deleteSession(sessionId);
    }

    clearSessionCookie(reply, options.config);
    return reply.status(204).send();
  });
};

export default authRoutes;
