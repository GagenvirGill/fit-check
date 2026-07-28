import type { FastifyRequest } from "fastify";

import { ApiError } from "../http/api-error";
import type { AuthUser } from "../../types/models";

export function unauthorizedError(): ApiError {
  return new ApiError(401, "Unauthorized");
}

export function getAuthUser(request: FastifyRequest): AuthUser {
  if (!request.authUser) {
    throw unauthorizedError();
  }

  return request.authUser;
}
