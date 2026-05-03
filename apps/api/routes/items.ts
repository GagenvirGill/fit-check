import type { FastifyPluginAsync } from 'fastify';
import { requireAuthUser } from '../lib/auth/middleware';
import {
  allCategoriesBelongToUser,
  canDeleteItem,
  createItemFromUpload,
  deleteItem,
  findOwnedItem,
  getRandomItem,
  getRandomItemByCategories,
  itemExists,
  listItemCategories,
  listItems,
  listItemsByCategories,
  parseCategoryFilter,
  parseCategoryIdsBody,
  replaceItemCategories,
} from '../services/items';

const itemsRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/', async (request, reply) => {
    const authUser = requireAuthUser(request);
    const categoryIds = parseCategoryFilter((request.query as { categories?: string }).categories);

    if (categoryIds.length === 0) {
      const items = await listItems(authUser.userId);
      return reply.status(200).send({ success: true, message: `Retrieved ${items.length} items`, data: items });
    }

    const filteredItems = await listItemsByCategories(authUser.userId, categoryIds);
    return reply.status(200).send({ success: true, message: `Retrieved ${filteredItems.length} filtered items`, data: filteredItems });
  });

  fastify.get('/random', async (request, reply) => {
    const authUser = requireAuthUser(request);
    const categoryIds = parseCategoryFilter((request.query as { categories?: string }).categories);

    if (categoryIds.length === 0) {
      const randomItem = await getRandomItem(authUser.userId);
      return reply.status(200).send({ success: true, message: 'Retrieved random item', data: randomItem });
    }

    const randomFiltered = await getRandomItemByCategories(authUser.userId, categoryIds);
    return reply.status(200).send({ success: true, message: 'Retrieved random filtered item', data: randomFiltered });
  });

  fastify.post('/', async (request, reply) => {
    const authUser = requireAuthUser(request);
    const file = await request.file();
    if (!file) {
      return reply.status(400).send({ success: false, message: 'Image file is required' });
    }

    const createdItem = await createItemFromUpload(authUser.userId, file);
    return reply.status(201).send({ success: true, message: 'Item created', data: createdItem });
  });

  fastify.delete('/:id', async (request, reply) => {
    const authUser = requireAuthUser(request);
    const itemId = (request.params as { id?: string }).id;
    if (!itemId) {
      return reply.status(400).send({ success: false, message: 'Item id is required' });
    }

    const item = await findOwnedItem(authUser.userId, itemId);
    if (!item) {
      return reply.status(404).send({ success: false, message: 'Item not found' });
    }

    const canDelete = await canDeleteItem(authUser.userId, itemId);
    if (!canDelete) {
      return reply.status(409).send({
        success: false,
        message: 'Cannot delete item while it is referenced by one or more outfits',
      });
    }

    await deleteItem(authUser.userId, itemId, item.imagePath);
    return reply.status(200).send({ success: true, message: 'Item deleted' });
  });

  fastify.get('/:id/categories', async (request, reply) => {
    const authUser = requireAuthUser(request);
    const itemId = (request.params as { id?: string }).id;
    if (!itemId) {
      return reply.status(400).send({ success: false, message: 'Item id is required' });
    }

    const categories = await listItemCategories(authUser.userId, itemId);
    return reply.status(200).send({ success: true, message: `Retrieved ${categories.length} categories for item`, data: categories });
  });

  fastify.put('/:id/categories', async (request, reply) => {
    const authUser = requireAuthUser(request);
    const itemId = (request.params as { id?: string }).id;
    if (!itemId) {
      return reply.status(400).send({ success: false, message: 'Item id is required' });
    }

    const categoryIds = parseCategoryIdsBody(request.body);
    const exists = await itemExists(authUser.userId, itemId);
    if (!exists) {
      return reply.status(404).send({ success: false, message: 'Item not found' });
    }

    const validCategories = await allCategoriesBelongToUser(authUser.userId, categoryIds);
    if (!validCategories) {
      return reply.status(400).send({ success: false, message: 'One or more categories were not found for this user' });
    }

    await replaceItemCategories(itemId, categoryIds);
    return reply.status(200).send({ success: true, message: 'Item categories updated' });
  });
};

export default itemsRoutes;
