import Fastify from "fastify";
import cookie from "@fastify/cookie";
import multipart from "@fastify/multipart";

import type { ApiConfig } from "./config";
import { defaultApiConfig } from "./config";
import { createRequireAuth } from "./lib/auth/middleware";
import { isApiError } from "./lib/http/api-error";
import authRoutes from "./routes/auth";
import categoriesRoutes from "./routes/categories";
import itemsRoutes from "./routes/items";
import outfitsRoutes from "./routes/outfits";
import type { ApiServices } from "./services";

export type CreateAppOptions = {
  services: ApiServices;
  config?: Partial<ApiConfig>;
};

export async function createApp(options: CreateAppOptions) {
  const config = {
    ...defaultApiConfig,
    ...options.config,
  };
  const app = Fastify({ logger: false });

  await app.register(cookie);
  await app.register(multipart, {
    limits: {
      fileSize: 10 * 1024 * 1024,
    },
  });

  app.setErrorHandler((error, _request, reply) => {
    if (isApiError(error)) {
      return reply.status(error.statusCode).send({ message: error.message });
    }

    return reply.status(500).send({ message: "Internal server error" });
  });

  app.setNotFoundHandler((_request, reply) => {
    return reply.status(404).send({ message: "Not found" });
  });

  await app.register(authRoutes, { prefix: "/api/auth", services: options.services, config });

  await app.register(async (protectedApp) => {
    protectedApp.addHook("preHandler", createRequireAuth(options.services, config));
    await protectedApp.register(itemsRoutes, { prefix: "/api/items", services: options.services });
    await protectedApp.register(categoriesRoutes, { prefix: "/api/categories", services: options.services });
    await protectedApp.register(outfitsRoutes, { prefix: "/api/outfits", services: options.services });
  });

  return app;
}
