import type { FastifyReply, FastifyRequest } from 'fastify';
import { readSession } from './session';

export const requireAuthUser = (request: FastifyRequest) => {
  if (!request.authUser) {
    throw Object.assign(new Error('Unauthorized'), { statusCode: 401 });
  }

  return request.authUser;
};

export const requireAuth = async (request: FastifyRequest, reply: FastifyReply) => {
  const session = readSession(request);
  request.authUser = session ?? undefined;
  if (!request.authUser) {
    return reply.status(401).send({ success: false, message: 'Unauthorized' });
  }
};
