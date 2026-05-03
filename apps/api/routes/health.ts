import type { FastifyPluginAsync } from 'fastify';

const healthRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/', async (_request, reply) => {
    return reply.status(200).send({
      success: true,
      message: 'Server is healthy',
      data: {
        uptimeSeconds: Math.floor(process.uptime()),
      },
    });
  });
};

export default healthRoutes;
