import type { FastifyInstance } from "fastify";

import { createApp } from "../../app";
import type { ApiServices } from "../../services";

export async function createTestApp(services: ApiServices) {
  return createApp({
    services,
    config: {
      frontendUrl: "http://frontend.test",
      cookieSecure: false,
    },
  });
}

export async function withTestApp<T>(
  services: ApiServices,
  run: (app: FastifyInstance) => Promise<T>,
): Promise<T> {
  const app = await createTestApp(services);

  try {
    return await run(app);
  } finally {
    await app.close();
  }
}

export const sessionCookie = "fit_check_session=session-1";
