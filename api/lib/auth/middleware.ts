import type { FastifyRequest } from "fastify";

import type { ApiConfig } from "../../config";
import type { ApiServices } from "../../services";
import { getSessionCookie } from "./cookies";
import { unauthorizedError } from "./current-user";

export function createRequireAuth(services: ApiServices, config: ApiConfig) {
  return async (request: FastifyRequest) => {
    const sessionId = getSessionCookie(request, config);
    if (!sessionId) {
      throw unauthorizedError();
    }

    const authUser = await services.auth.getSessionUser(sessionId);
    if (!authUser) {
      throw unauthorizedError();
    }

    request.authUser = authUser;
  };
}
