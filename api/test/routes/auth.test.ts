import { describe, expect, it } from "vitest";

import { withTestApp } from "../helpers/app";
import { createMockServices } from "../helpers/services";

describe("auth routes", () => {
  it("redirects to Google and sets an OAuth state cookie", async () => {
    const services = createMockServices();

    await withTestApp(services, async (app) => {
      const response = await app.inject({ method: "GET", url: "/api/auth/google" });

      expect(response.statusCode).toBe(302);
      expect(response.headers.location).toBe("https://accounts.example.test/oauth?state=state-1");
      expect(response.headers["set-cookie"]).toContain("fit_check_oauth_state=state-1");
    });
  });

  it("sets a session cookie after a valid OAuth callback", async () => {
    const services = createMockServices();

    await withTestApp(services, async (app) => {
      const response = await app.inject({
        method: "GET",
        url: "/api/auth/google/callback?code=code-1&state=state-1",
        headers: {
          cookie: "fit_check_oauth_state=state-1",
        },
      });

      expect(response.statusCode).toBe(302);
      expect(response.headers.location).toBe("http://frontend.test");
      expect(response.headers["set-cookie"]?.toString()).toContain("fit_check_session=session-1");
      expect(services.auth.exchangeGoogleCode).toHaveBeenCalledWith("code-1");
    });
  });

  it("returns the current user for a valid session", async () => {
    const services = createMockServices();

    await withTestApp(services, async (app) => {
      const response = await app.inject({
        method: "GET",
        url: "/api/auth/me",
        headers: {
          cookie: "fit_check_session=session-1",
        },
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual({
        userId: "user-1",
        email: "test@example.com",
        provider: "google",
      });
    });
  });

  it("clears and deletes the current session on logout", async () => {
    const services = createMockServices();

    await withTestApp(services, async (app) => {
      const response = await app.inject({
        method: "POST",
        url: "/api/auth/logout",
        headers: {
          cookie: "fit_check_session=session-1",
        },
      });

      expect(response.statusCode).toBe(204);
      expect(response.headers["set-cookie"]).toContain("fit_check_session=");
      expect(services.auth.deleteSession).toHaveBeenCalledWith("session-1");
    });
  });
});
