import type { FastifyPluginAsync } from 'fastify';
import { requireAuthUser } from '../lib/auth/middleware';
import { createCategory, deleteCategory, listCategories, updateCategory, userOwnsItem } from '../services/categories';
import { isDatabaseUniqueViolation } from '../lib/database-errors';

const categoriesRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/', async (request, reply) => {
    const authUser = requireAuthUser(request);
    const categories = await listCategories(authUser.userId);
    return reply.status(200).send({ success: true, message: `Retrieved ${categories.length} categories`, data: categories });
  });

  fastify.post('/', async (request, reply) => {
    const authUser = requireAuthUser(request);
    if (typeof request.body !== 'object' || request.body === null || Array.isArray(request.body)) {
      return reply.status(400).send({ success: false, message: 'Request body must be an object' });
    }

    const name = (request.body as { name?: string }).name?.trim();

    if (!name) {
      return reply.status(400).send({ success: false, message: 'Category name is required' });
    }

    let created;
    try {
      created = await createCategory(authUser.userId, name);
    } catch (error) {
      if (isDatabaseUniqueViolation(error)) {
        return reply.status(409).send({ success: false, message: 'Category name already exists for this user' });
      }
      throw error;
    }

    return reply.status(201).send({ success: true, message: `Category ${name} created`, data: created[0] });
  });

  fastify.patch('/:id', async (request, reply) => {
    const authUser = requireAuthUser(request);
    const categoryId = (request.params as { id?: string }).id;
    if (!categoryId) {
      return reply.status(400).send({ success: false, message: 'Category id is required' });
    }

    if (typeof request.body !== 'object' || request.body === null || Array.isArray(request.body)) {
      return reply.status(400).send({ success: false, message: 'Request body must be an object' });
    }

    const body = request.body as { name?: string; favoriteItem?: string | null };
    const updates: { name?: string; favoriteItem?: string | null } = {};
    if (body.name !== undefined) {
      const name = body.name.trim();
      if (!name) {
        return reply.status(400).send({ success: false, message: 'Category name cannot be empty' });
      }
      updates.name = name;
    }

    if (body.favoriteItem !== undefined) {
      if (body.favoriteItem === null) {
        updates.favoriteItem = null;
      } else {
        const ownsItem = await userOwnsItem(authUser.userId, body.favoriteItem);
        if (!ownsItem) {
          return reply.status(400).send({ success: false, message: 'favoriteItem must reference an item owned by the user' });
        }
        updates.favoriteItem = body.favoriteItem;
      }
    }

    if (Object.keys(updates).length === 0) {
      return reply.status(400).send({ success: false, message: 'No valid category updates provided' });
    }

    let updated;
    try {
      updated = await updateCategory(authUser.userId, categoryId, updates);
    } catch (error) {
      if (isDatabaseUniqueViolation(error)) {
        return reply.status(409).send({ success: false, message: 'Category name already exists for this user' });
      }
      throw error;
    }

    if (!updated[0]) {
      return reply.status(404).send({ success: false, message: 'Category not found' });
    }

    return reply.status(200).send({ success: true, message: 'Category updated', data: updated[0] });
  });

  fastify.delete('/:id', async (request, reply) => {
    const authUser = requireAuthUser(request);
    const categoryId = (request.params as { id?: string }).id;
    if (!categoryId) {
      return reply.status(400).send({ success: false, message: 'Category id is required' });
    }

    const deleted = await deleteCategory(authUser.userId, categoryId);
    if (!deleted[0]) {
      return reply.status(404).send({ success: false, message: 'Category not found' });
    }

    return reply.status(200).send({ success: true, message: 'Category deleted' });
  });
};

export default categoriesRoutes;
