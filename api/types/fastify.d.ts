import type { AuthUser } from "./models";

declare module "fastify" {
  interface FastifyRequest {
    authUser?: AuthUser;
  }
}
