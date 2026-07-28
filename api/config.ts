export type ApiConfig = {
  frontendUrl: string;
  sessionCookieName: string;
  oauthStateCookieName: string;
  sessionTtlSeconds: number;
  oauthStateTtlSeconds: number;
  cookieSecure: boolean;
  cookieSameSite: "strict" | "lax" | "none";
  cookieDomain?: string;
};

export const defaultApiConfig: ApiConfig = {
  frontendUrl: "http://localhost:5173",
  sessionCookieName: "fit_check_session",
  oauthStateCookieName: "fit_check_oauth_state",
  sessionTtlSeconds: 60 * 60 * 24 * 7,
  oauthStateTtlSeconds: 60 * 5,
  cookieSecure: false,
  cookieSameSite: "lax",
};
