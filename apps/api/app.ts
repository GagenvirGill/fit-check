import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import multipart from '@fastify/multipart';
import rateLimit from '@fastify/rate-limit';
import cookie from '@fastify/cookie';
import { envConfig, isProduction } from '#lib/env-config';
import healthRoutes from '#routes/health';
import authRoutes from '#routes/auth';
import bootstrapRoutes from '#routes/bootstrap';
import itemsRoutes from '#routes/items';
import categoriesRoutes from '#routes/categories';
import outfitsRoutes from '#routes/outfits';
import { requireAuth } from '#lib/auth/middleware';

export const createApp = async () => {
  const app = Fastify({
    logger: true,
    ajv: {
      customOptions: {
        coerceTypes: false,
      },
    },
  });

  await app.register(cookie);
  await app.register(cors, {
    origin: envConfig.frontendUrl,
    credentials: true,
  });
  await app.register(helmet);
  await app.register(multipart, {
    limits: {
      fileSize: 10 * 1024 * 1024,
    },
  });
  await app.register(rateLimit, {
    max: 120,
    timeWindow: '1 minute',
  });

  app.setErrorHandler((error, _request, reply) => {
    app.log.error(error);

    let message = isProduction ? 'Internal server error' : 'Unknown error';
    if (error instanceof Error && error.message) {
      message = error.message;
    }

    reply.status(500).send({ success: false, message });
  });

  await app.register(healthRoutes, { prefix: '/health' });
  await app.register(authRoutes, { prefix: '/auth' });

  await app.register(async (protectedApp) => {
    protectedApp.addHook('preHandler', requireAuth);
    await protectedApp.register(bootstrapRoutes, { prefix: '/bootstrap' });
    await protectedApp.register(itemsRoutes, { prefix: '/items' });
    await protectedApp.register(categoriesRoutes, { prefix: '/categories' });
    await protectedApp.register(outfitsRoutes, { prefix: '/outfits' });
  });

  return app;
};
