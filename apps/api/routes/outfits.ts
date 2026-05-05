import type { FastifyPluginAsync } from 'fastify';
import type {
  CreateOutfitRequest,
  CreateOutfitResponse,
  OutfitIdParam,
} from '@fit-check/shared/types/contracts/outfits';
import { createOutfitBodySchema, outfitIdParamSchema } from '@fit-check/shared/types/contracts/outfits';
import {
  createOutfit,
  deleteOutfit,
} from '#lib/database/queries/outfits';
import { isDatabaseQueryError } from '#lib/database/query-error';

const outfitsRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post('/', { schema: { body: createOutfitBodySchema } }, async (request, reply) => {
    const authUser = request.authUser;
    if (!authUser) {
      return reply.status(401).send({ message: 'Unauthorized' });
    }

    try {
      const body = request.body as CreateOutfitRequest;
      const outfit = await createOutfit(authUser.userId, {
        dateWorn: body.dateWorn,
        description: body.description,
        layout: body.layout,
      });

      const response: CreateOutfitResponse = outfit;
      return reply.status(201).send(response);
    } catch (error) {
      if (isDatabaseQueryError(error)) {
        return reply.status(error.statusCode).send({ message: error.message });
      }
      throw error;
    }
  });

  fastify.delete('/:id', { schema: { params: outfitIdParamSchema } }, async (request, reply) => {
    const authUser = request.authUser;
    if (!authUser) {
      return reply.status(401).send({ message: 'Unauthorized' });
    }

    const { id: outfitId } = request.params as OutfitIdParam;
    try {
      await deleteOutfit(authUser.userId, outfitId);
      return reply.status(204).send();
    } catch (error) {
      if (isDatabaseQueryError(error)) {
        return reply.status(error.statusCode).send({ message: error.message });
      }
      throw error;
    }
  });
};

export default outfitsRoutes;
