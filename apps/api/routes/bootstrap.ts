import type { FastifyPluginAsync } from 'fastify';
import { requireAuthUser } from '../lib/auth/middleware';
import { getBootstrapData } from '../services/bootstrap';
import { ok } from '../lib/http/responses';

const bootstrapRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/', async (request, reply) => {
    const authUser = requireAuthUser(request);
    const data = await getBootstrapData(authUser.userId);
    return ok(reply, 'Bootstrap data loaded', data);
  });
};

export default bootstrapRoutes;
