import type { FastifyReply, FastifyRequest } from "fastify";

import type { ApiConfig } from "../../config";

const COOKIE_PATH = "/";

type CookieOptions = {
  httpOnly: true;
  secure: boolean;
  sameSite: "strict" | "lax" | "none";
  path: string;
  domain?: string;
  maxAge?: number;
};

function cookieOptions(config: ApiConfig, maxAge?: number): CookieOptions {
  return {
    httpOnly: true,
    secure: config.cookieSecure,
    sameSite: config.cookieSameSite,
    path: COOKIE_PATH,
    domain: config.cookieDomain,
    maxAge,
  };
}

export function getSessionCookie(request: FastifyRequest, config: ApiConfig): string | undefined {
  return request.cookies[config.sessionCookieName];
}

export function setSessionCookie(reply: FastifyReply, config: ApiConfig, sessionId: string) {
  reply.setCookie(config.sessionCookieName, sessionId, cookieOptions(config, config.sessionTtlSeconds));
}

export function clearSessionCookie(reply: FastifyReply, config: ApiConfig) {
  reply.clearCookie(config.sessionCookieName, cookieOptions(config));
}

export function getOauthStateCookie(request: FastifyRequest, config: ApiConfig): string | undefined {
  return request.cookies[config.oauthStateCookieName];
}

export function setOauthStateCookie(reply: FastifyReply, config: ApiConfig, state: string) {
  reply.setCookie(config.oauthStateCookieName, state, cookieOptions(config, config.oauthStateTtlSeconds));
}

export function clearOauthStateCookie(reply: FastifyReply, config: ApiConfig) {
  reply.clearCookie(config.oauthStateCookieName, cookieOptions(config));
}
