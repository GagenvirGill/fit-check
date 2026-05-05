import { isProduction } from '#lib/env-config';

export const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
export const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
export const GOOGLE_USERINFO_URL = 'https://openidconnect.googleapis.com/v1/userinfo';

export const SESSION_COOKIE_NAME = 'fitcheck_session';
export const OAUTH_STATE_COOKIE_NAME = 'fitcheck_oauth_state';
export const SESSION_TTL = 60 * 60 * 24 * 14;

export const cookieBaseOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: (isProduction ? 'none' : 'lax') as 'none' | 'lax',
  path: '/',
};
