import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import multipart from '@fastify/multipart';
import rateLimit from '@fastify/rate-limit';
import cookie from '@fastify/cookie';
import { envConfig, isProduction } from './lib/env-config';
import healthRoutes from './routes/health';
import authRoutes from './routes/auth';
import bootstrapRoutes from './routes/bootstrap';
import itemsRoutes from './routes/items';
import categoriesRoutes from './routes/categories';
import outfitsRoutes from './routes/outfits';
import { requireAuth } from './lib/auth/middleware';

export const createApp = async () => {
  const app = Fastify({
    logger: true,
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
    const withStatus = error as Error & { statusCode?: number };
    if (typeof withStatus.statusCode === 'number' && withStatus.statusCode >= 400 && withStatus.statusCode < 600) {
      return reply.status(withStatus.statusCode).send({
        success: false,
        message: withStatus.message,
      });
    }

    app.log.error(error);
    const message = isProduction ? 'Internal server error' : (error instanceof Error ? error.message : 'Unknown error');
    return reply.status(500).send({
      success: false,
      message,
    });
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
