import type { FastifyPluginAsync } from 'fastify';
import { requireAuthUser } from '../lib/auth/middleware';
import { getBootstrapData } from '../services/bootstrap';

const bootstrapRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/', async (request, reply) => {
    const authUser = requireAuthUser(request);
    const data = await getBootstrapData(authUser.userId);

    return reply.status(200).send({
      success: true,
      message: 'Bootstrap data loaded',
      data,
    });
  });
};

export default bootstrapRoutes;
