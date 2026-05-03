import type { FastifyPluginAsync } from 'fastify';
import { requireAuthUser } from '../lib/auth/middleware';
import { allItemsBelongToUser, createOutfit, deleteOutfit, listOutfits, searchOutfits } from '../services/outfits';
import { isValidLayout } from '../lib/outfit-layout';

const outfitsRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/', async (request, reply) => {
    const authUser = requireAuthUser(request);
    const outfits = await listOutfits(authUser.userId);
    return reply.status(200).send({ success: true, message: `Retrieved ${outfits.length} outfits`, data: outfits });
  });

  fastify.post('/', async (request, reply) => {
    const authUser = requireAuthUser(request);
    if (typeof request.body !== 'object' || request.body === null || Array.isArray(request.body)) {
      return reply.status(400).send({ success: false, message: 'Request body must be an object' });
    }

    const { dateWorn, description, layout } = request.body as {
      dateWorn?: string;
      description?: string | null;
      layout?: unknown;
    };

    if (!dateWorn) {
      return reply.status(400).send({ success: false, message: 'dateWorn is required' });
    }

    if (!isValidLayout(layout)) {
      return reply.status(400).send({ success: false, message: 'layout must be a two-dimensional array of { itemId, weight }' });
    }

    const allItemIds = [...new Set(layout.flat().map((item) => item.itemId))];
    const validItems = await allItemsBelongToUser(authUser.userId, allItemIds);
    if (!validItems) {
      return reply.status(400).send({ success: false, message: 'layout includes one or more items not owned by the user' });
    }

    const created = await createOutfit(authUser.userId, { dateWorn, description, layout });
    return reply.status(201).send({ success: true, message: `Outfit created for ${dateWorn}`, data: created });
  });

  fastify.delete('/:id', async (request, reply) => {
    const authUser = requireAuthUser(request);
    const outfitId = (request.params as { id?: string }).id;
    if (!outfitId) {
      return reply.status(400).send({ success: false, message: 'Outfit id is required' });
    }

    const deleted = await deleteOutfit(authUser.userId, outfitId);
    if (!deleted[0]) {
      return reply.status(404).send({ success: false, message: 'Outfit not found' });
    }

    return reply.status(200).send({ success: true, message: 'Outfit deleted' });
  });

  fastify.get('/search', async (request, reply) => {
    const authUser = requireAuthUser(request);
    const query = ((request.query as { query?: string }).query ?? '').trim();
    if (!query) {
      return reply.status(400).send({ success: false, message: 'query is required' });
    }

    const outfits = await searchOutfits(authUser.userId, query);
    return reply.status(200).send({ success: true, message: `Retrieved ${outfits.length} outfits for search query`, data: outfits });
  });
};

export default outfitsRoutes;
