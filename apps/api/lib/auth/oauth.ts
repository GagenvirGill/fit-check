import { randomBytes } from 'node:crypto';
import { envConfig } from '#lib/env-config';
import { GOOGLE_AUTH_URL, GOOGLE_TOKEN_URL, GOOGLE_USERINFO_URL } from '#lib/auth/constants';

type GoogleUserInfo = {
  sub: string;
  email: string;
};

export class OauthProviderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OauthProviderError';
  }
}

const exchangeAuthCode = async (code: string) => {
  const body = new URLSearchParams({
    code,
    client_id: envConfig.googleClientId,
    client_secret: envConfig.googleClientSecret,
    redirect_uri: envConfig.googleCallbackUrl,
    grant_type: 'authorization_code',
  });

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  });

  if (!response.ok) {
    throw new OauthProviderError('Google token exchange failed');
  }

  const data = await response.json();
  if (typeof data.access_token !== 'string') {
    throw new OauthProviderError('Invalid Google token payload');
  }

  return data.access_token as string;
};

const fetchGoogleUserInfo = async (accessToken: string): Promise<GoogleUserInfo> => {
  const response = await fetch(GOOGLE_USERINFO_URL, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new OauthProviderError('Google user info fetch failed');
  }

  const data = await response.json();
  if (typeof data.sub !== 'string' || typeof data.email !== 'string') {
    throw new OauthProviderError('Invalid Google user profile');
  }

  return {
    sub: data.sub,
    email: data.email,
  };
};

export const getGoogleUserFromCode = async (code: string): Promise<GoogleUserInfo> => {
  const accessToken = await exchangeAuthCode(code);
  return fetchGoogleUserInfo(accessToken);
};

export const createOauthState = (): string => randomBytes(18).toString('hex');

export const buildGoogleAuthUrl = (state: string): string => {
  const params = new URLSearchParams({
    client_id: envConfig.googleClientId,
    redirect_uri: envConfig.googleCallbackUrl,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    prompt: 'select_account',
    state,
  });

  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
};
