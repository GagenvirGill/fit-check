import type { FastifyPluginAsync } from 'fastify';
import { ok } from '../lib/http/responses';

const healthRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/', async (_request, reply) => ok(reply, 'Server is healthy', {
    uptimeSeconds: Math.floor(process.uptime()),
  }));
};

export default healthRoutes;
