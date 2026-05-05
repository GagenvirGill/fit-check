import type { FastifyPluginAsync } from 'fastify';
import { requireAuthUser } from '../lib/auth/middleware';
import { badRequest, conflict, notFound } from '../lib/http/errors';
import { created, ok } from '../lib/http/responses';
import {
  categoryFilterQuerySchema,
  idParamSchema,
  replaceItemCategoriesBodySchema,
  routeSchema,
} from '../lib/http/schemas';
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
  fastify.get('/', routeSchema({
    querystring: categoryFilterQuerySchema,
  }), async (request, reply) => {
    const authUser = requireAuthUser(request);
    const categoryIds = parseCategoryFilter((request.query as { categories?: string }).categories);

    if (categoryIds.length === 0) {
      const items = await listItems(authUser.userId);
      return ok(reply, `Retrieved ${items.length} items`, items);
    }

    const filteredItems = await listItemsByCategories(authUser.userId, categoryIds);
    return ok(reply, `Retrieved ${filteredItems.length} filtered items`, filteredItems);
  });

  fastify.get('/random', routeSchema({
    querystring: categoryFilterQuerySchema,
  }), async (request, reply) => {
    const authUser = requireAuthUser(request);
    const categoryIds = parseCategoryFilter((request.query as { categories?: string }).categories);

    if (categoryIds.length === 0) {
      const randomItem = await getRandomItem(authUser.userId);
      return ok(reply, 'Retrieved random item', randomItem);
    }

    const randomFiltered = await getRandomItemByCategories(authUser.userId, categoryIds);
    return ok(reply, 'Retrieved random filtered item', randomFiltered);
  });

  fastify.post('/', async (request, reply) => {
    const authUser = requireAuthUser(request);
    const file = await request.file();
    if (!file) {
      throw badRequest('Image file is required');
    }

    const createdItem = await createItemFromUpload(authUser.userId, file);
    return created(reply, 'Item created', createdItem);
  });

  fastify.delete('/:id', routeSchema({
    params: idParamSchema,
  }), async (request, reply) => {
    const authUser = requireAuthUser(request);
    const { id: itemId } = request.params as { id: string };
    const item = await findOwnedItem(authUser.userId, itemId);
    if (!item) {
      throw notFound('Item not found');
    }

    const canDelete = await canDeleteItem(authUser.userId, itemId);
    if (!canDelete) {
      throw conflict('Cannot delete item while it is referenced by one or more outfits');
    }

    await deleteItem(authUser.userId, itemId, item.imagePath);
    return ok(reply, 'Item deleted');
  });

  fastify.get('/:id/categories', routeSchema({
    params: idParamSchema,
  }), async (request, reply) => {
    const authUser = requireAuthUser(request);
    const { id: itemId } = request.params as { id: string };
    const categories = await listItemCategories(authUser.userId, itemId);
    return ok(reply, `Retrieved ${categories.length} categories for item`, categories);
  });

  fastify.put('/:id/categories', routeSchema({
    params: idParamSchema,
    body: replaceItemCategoriesBodySchema,
  }), async (request, reply) => {
    const authUser = requireAuthUser(request);
    const { id: itemId } = request.params as { id: string };
    const categoryIds = parseCategoryIdsBody(request.body);
    const exists = await itemExists(authUser.userId, itemId);
    if (!exists) {
      throw notFound('Item not found');
    }

    const validCategories = await allCategoriesBelongToUser(authUser.userId, categoryIds);
    if (!validCategories) {
      throw badRequest('One or more categories were not found for this user');
    }

    await replaceItemCategories(itemId, categoryIds);
    return ok(reply, 'Item categories updated');
  });
};

export default itemsRoutes;
