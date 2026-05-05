import type { FastifyReply, FastifyRequest } from 'fastify';
import { readSession } from '#lib/auth/session';

export const requireAuth = async (request: FastifyRequest, reply: FastifyReply) => {
  const session = readSession(request);
  request.authUser = session ?? undefined;
  if (!request.authUser) {
    return reply.status(401).send({ message: 'Unauthorized' });
  }
};
