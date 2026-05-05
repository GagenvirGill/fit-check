import type { FastifyPluginAsync } from 'fastify';
import type { OutfitLayout } from '@fit-check/shared/types/models';
import { requireAuthUser } from '#lib/auth/middleware';
import { badRequest, notFound } from '#lib/http/errors';
import { created, ok } from '#lib/http/responses';
import {
  createOutfitBodySchema,
  idParamSchema,
  routeSchema,
} from '#lib/http/schemas';
import { getUniqueLayoutItemIds } from '#lib/outfit-layout';
import {
  allItemsBelongToUser,
  createOutfit,
  deleteOutfit,
} from '#lib/database/queries/outfits';

type CreateOutfitBody = {
  dateWorn: string;
  description?: string | null;
  layout: OutfitLayout;
};

const outfitsRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post('/', routeSchema({
    body: createOutfitBodySchema,
  }), async (request, reply) => {
    const authUser = requireAuthUser(request);
    const { dateWorn, description, layout } = request.body as CreateOutfitBody;
    const allItemIds = getUniqueLayoutItemIds(layout);
    const validItems = await allItemsBelongToUser(authUser.userId, allItemIds);
    if (!validItems) {
      throw badRequest('layout includes one or more items not owned by the user');
    }

    const outfit = await createOutfit(authUser.userId, { dateWorn, description, layout });
    return created(reply, `Outfit created for ${dateWorn}`, outfit);
  });

  fastify.delete('/:id', routeSchema({
    params: idParamSchema,
  }), async (request, reply) => {
    const authUser = requireAuthUser(request);
    const { id: outfitId } = request.params as { id: string };
    const deleted = await deleteOutfit(authUser.userId, outfitId);
    if (!deleted[0]) {
      throw notFound('Outfit not found');
    }

    return ok(reply, 'Outfit deleted');
  });
};

export default outfitsRoutes;
