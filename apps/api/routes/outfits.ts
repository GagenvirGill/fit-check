import type { FastifyPluginAsync } from 'fastify';
import type {
  CreateOutfitRequest,
  CreateOutfitResponse,
  OutfitIdParam,
} from '@fit-check/shared/types/contracts/outfits';
import { createOutfitBodySchema, outfitIdParamSchema } from '@fit-check/shared/types/contracts/outfits';
import { getUniqueLayoutItemIds } from '#lib/outfit-layout';
import {
  allItemsBelongToUser,
  createOutfit,
  deleteOutfit,
} from '#lib/database/queries/outfits';

const outfitsRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post('/', { schema: { body: createOutfitBodySchema } }, async (request, reply) => {
    const authUser = request.authUser;
    if (!authUser) {
      return reply.status(401).send({ message: 'Unauthorized' });
    }

    const body = request.body as CreateOutfitRequest;
    const { layout } = body;
    const allItemIds = getUniqueLayoutItemIds(layout);
    const validItems = await allItemsBelongToUser(authUser.userId, allItemIds);
    if (!validItems) {
      return reply.status(400).send({
        message: 'layout includes one or more items not owned by the user',
      });
    }

    const outfit = await createOutfit(authUser.userId, {
      dateWorn: body.dateWorn,
      description: body.description,
      layout: body.layout,
    });

    const response: CreateOutfitResponse = outfit;
    return reply.status(201).send(response);
  });

  fastify.delete('/:id', { schema: { params: outfitIdParamSchema } }, async (request, reply) => {
    const authUser = request.authUser;
    if (!authUser) {
      return reply.status(401).send({ message: 'Unauthorized' });
    }

    const { id: outfitId } = request.params as OutfitIdParam;
    const deleted = await deleteOutfit(authUser.userId, outfitId);
    if (!deleted[0]) {
      return reply.status(404).send({ message: 'Outfit not found' });
    }

    return reply.status(204).send();
  });
};

export default outfitsRoutes;
