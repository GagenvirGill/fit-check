import type { FastifyPluginAsync } from 'fastify';
import type { HealthResponse } from '@fit-check/shared/types/contracts/health';

const healthRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/', async (_request, reply) => {
    const body: HealthResponse = {
      uptimeSeconds: Math.floor(process.uptime()),
    };

    return reply.status(200).send(body);
  });
};

export default healthRoutes;
