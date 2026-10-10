import { randomBytes } from "node:crypto";

import { Router } from "express";
import jwt from "jsonwebtoken";

import type {
  AuthUser,
  GetCurrentUserResponse,
} from "#packages/contracts/auth";
import { env } from "../lib/get-env";
import { upsertOAuthUser } from "../lib/queries/auth-queries";
import { requireAuth, SESSION_COOKIE_NAME } from "../lib/session";

type GoogleTokenResponse = {
  access_token: string;
};

type GoogleUserInfoResponse = {
  sub: string;
  email: string;
};

type GoogleCallbackQuery = {
  code?: string;
  state?: string;
};

const OAUTH_STATE_COOKIE_NAME = "fit_check_oauth_state";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;
const OAUTH_STATE_TTL_SECONDS = 60 * 5;

export const authRoutes = Router();

authRoutes.get("/google", (_request, response) => {
  const state = randomBytes(32).toString("hex");
  response.cookie(
    OAUTH_STATE_COOKIE_NAME,
    state,
    cookieOptions(OAUTH_STATE_TTL_SECONDS),
  );
  response.redirect(
    buildGoogleAuthUrl(env.googleClientId, env.googleCallbackUrl, state),
  );
});

authRoutes.get("/google/callback", async (request, response) => {
  const query = request.query as GoogleCallbackQuery;
  const expectedState = request.cookies[OAUTH_STATE_COOKIE_NAME];
  response.clearCookie(OAUTH_STATE_COOKIE_NAME, cookieOptions());

  if (
    !query.code ||
    !query.state ||
    !expectedState ||
    query.state !== expectedState
  ) {
    response.status(400).json({ message: "OAuth state validation failed" });
    return;
  }

  const googleUser = await exchangeGoogleCode(query.code);
  if (!googleUser) {
    response.status(400).json({ message: "Google OAuth failed" });
    return;
  }

  const user = await upsertOAuthUser({
    provider: "google",
    providerId: googleUser.sub,
    email: googleUser.email,
  });

  response.cookie(
    SESSION_COOKIE_NAME,
    signSession(env.jwtSecret, SESSION_TTL_SECONDS, user),
    {
      ...cookieOptions(SESSION_TTL_SECONDS),
      maxAge: SESSION_TTL_SECONDS * 1000,
    },
  );
  response.redirect(env.frontendUrl);
});

authRoutes.get("/me", requireAuth, (request, response) => {
  const body: GetCurrentUserResponse = request.authUser;
  response.status(200).json(body);
});

authRoutes.post("/logout", (_request, response) => {
  response.clearCookie(SESSION_COOKIE_NAME, cookieOptions());
  response.status(204).send();
});

function cookieOptions(maxAgeSeconds?: number): {
  httpOnly: true;
  secure: boolean;
  sameSite: "lax" | "none";
  path: string;
  maxAge: number | undefined;
} {
  // The prod web app is served from a different site than the API, so the
  // session cookie must be sent on cross-site requests.
  const isProd = env.mode === "prod";
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    path: "/",
    maxAge: maxAgeSeconds ? maxAgeSeconds * 1000 : undefined,
  };
}

function buildGoogleAuthUrl(
  clientId: string,
  redirectUri: string,
  state: string,
): string {
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid email");
  url.searchParams.set("state", state);
  return url.toString();
}

function signSession(
  jwtSecret: string,
  sessionTtlSeconds: number,
  user: AuthUser,
): string {
  return jwt.sign({ userId: user.userId }, jwtSecret, {
    expiresIn: sessionTtlSeconds,
  });
}

async function exchangeGoogleCode(
  code: string,
): Promise<GoogleUserInfoResponse | null> {
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: env.googleClientId,
      client_secret: env.googleClientSecret,
      code,
      grant_type: "authorization_code",
      redirect_uri: env.googleCallbackUrl,
    }),
  });

  if (!tokenResponse.ok) {
    return null;
  }

  const tokenJson = (await tokenResponse.json()) as GoogleTokenResponse;
  const userInfoResponse = await fetch(
    "https://www.googleapis.com/oauth2/v3/userinfo",
    {
      headers: { authorization: `Bearer ${tokenJson.access_token}` },
    },
  );

  if (!userInfoResponse.ok) {
    return null;
  }

  return (await userInfoResponse.json()) as GoogleUserInfoResponse;
}
