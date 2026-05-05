import type { FastifyPluginAsync } from 'fastify';
import type { BootstrapResponse } from '@fit-check/shared/types/contracts/bootstrap';
import { getBootstrapData } from '#lib/database/queries/bootstrap';

const bootstrapRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/', async (request, reply) => {
    const authUser = request.authUser;
    if (!authUser) {
      return reply.status(401).send({ message: 'Unauthorized' });
    }

    const data = await getBootstrapData(authUser.userId);
    const body: BootstrapResponse = data;
    return reply.status(200).send(body);
  });
};

export default bootstrapRoutes;
