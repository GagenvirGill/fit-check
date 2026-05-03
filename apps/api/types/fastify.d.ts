import 'fastify';

type SessionUser = {
  userId: string;
  email: string;
};

declare module 'fastify' {
  interface FastifyRequest {
    authUser?: SessionUser;
  }
}

export {};
