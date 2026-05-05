import type { FastifyPluginAsync } from 'fastify';
import type { OutfitLayout } from '@fit-check/shared/types/models';
import { requireAuthUser } from '#lib/auth/middleware';
import { getUniqueLayoutItemIds } from '#lib/outfit-layout';
import {
  allItemsBelongToUser,
  createOutfit,
  deleteOutfit,
} from '#lib/database/queries/outfits';
import { idParamSchema } from '#types/schemas/shared';
import { createOutfitBodySchema } from '#types/schemas/outfits';

type CreateOutfitBody = {
  dateWorn: string;
  description?: string | null;
  layout: OutfitLayout;
};

const outfitsRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post('/', { schema: { body: createOutfitBodySchema } }, async (request, reply) => {
    const authUser = requireAuthUser(request);
    const { dateWorn, description, layout } = request.body as CreateOutfitBody;
    const allItemIds = getUniqueLayoutItemIds(layout);
    const validItems = await allItemsBelongToUser(authUser.userId, allItemIds);
    if (!validItems) {
      throw new Error('layout includes one or more items not owned by the user');
    }

    const outfit = await createOutfit(authUser.userId, { dateWorn, description, layout });
    return reply.status(201).send({ success: true, message: `Outfit created for ${dateWorn}`, data: outfit });
  });

  fastify.delete('/:id', { schema: { params: idParamSchema } }, async (request, reply) => {
    const authUser = requireAuthUser(request);
    const { id: outfitId } = request.params as { id: string };
    const deleted = await deleteOutfit(authUser.userId, outfitId);
    if (!deleted[0]) {
      throw new Error('Outfit not found');
    }

    return reply.status(200).send({ success: true, message: 'Outfit deleted' });
  });
};

export default outfitsRoutes;
