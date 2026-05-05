import type { FastifyReply } from 'fastify';

type SuccessResponse<T> = {
  success: true;
  message: string;
  data?: T;
};

export const sendSuccess = <T>(reply: FastifyReply, statusCode: number, message: string, data?: T) => {
  const payload: SuccessResponse<T> = {
    success: true,
    message,
  };

  if (data !== undefined) {
    payload.data = data;
  }

  return reply.status(statusCode).send(payload);
};

export const ok = <T>(reply: FastifyReply, message: string, data?: T) => sendSuccess(reply, 200, message, data);

export const created = <T>(reply: FastifyReply, message: string, data?: T) => sendSuccess(reply, 201, message, data);

export const sendFailure = (reply: FastifyReply, statusCode: number, message: string) =>
  reply.status(statusCode).send({
    success: false,
    message,
  });
