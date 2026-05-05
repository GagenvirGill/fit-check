import type { FastifyPluginAsync } from 'fastify';
import { requireAuthUser } from '#lib/auth/middleware';
import { isDatabaseUniqueViolation } from '#lib/database-errors';
import {
  categoryNameExists,
  createCategory,
  deleteCategory,
  updateCategory,
  userOwnsItem,
} from '#lib/database/queries/categories';
import { idParamSchema } from '#types/schemas/shared';
import { createCategoryBodySchema, updateCategoryBodySchema } from '#types/schemas/categories';

type CategoryUpdateBody = {
  name?: string;
  favoriteItem?: string | null;
};

const categoriesRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post('/', { schema: { body: createCategoryBodySchema } }, async (request, reply) => {
    const authUser = requireAuthUser(request);
    const { name: rawName } = request.body as { name: string };
    const name = rawName.trim();
    if (!name) {
      throw new Error('Category name is required');
    }

    if (await categoryNameExists(authUser.userId, name)) {
      throw new Error('Category name already exists for this user');
    }

    try {
      const category = await createCategory(authUser.userId, name);
      return reply.status(201).send({ success: true, message: `Category ${name} created`, data: category[0] });
    } catch (error) {
      if (isDatabaseUniqueViolation(error)) {
        throw new Error('Category name already exists for this user');
      }
      throw error;
    }
  });

  fastify.patch('/:id', { schema: { params: idParamSchema, body: updateCategoryBodySchema } }, async (request, reply) => {
    const authUser = requireAuthUser(request);
    const { id: categoryId } = request.params as { id: string };
    const body = request.body as CategoryUpdateBody;
    const updates: { name?: string; favoriteItem?: string | null } = {};

    if (body.name !== undefined) {
      const name = body.name.trim();
      if (!name) {
        throw new Error('Category name cannot be empty');
      }
      updates.name = name;
    }

    if (body.favoriteItem !== undefined) {
      if (body.favoriteItem === null) {
        updates.favoriteItem = null;
      } else {
        const ownsItem = await userOwnsItem(authUser.userId, body.favoriteItem);
        if (!ownsItem) {
          throw new Error('favoriteItem must reference an item owned by the user');
        }
        updates.favoriteItem = body.favoriteItem;
      }
    }

    if (Object.keys(updates).length === 0) {
      throw new Error('No valid category updates provided');
    }

    try {
      const category = await updateCategory(authUser.userId, categoryId, updates);
      if (!category[0]) {
        throw new Error('Category not found');
      }
      return reply.status(200).send({ success: true, message: 'Category updated', data: category[0] });
    } catch (error) {
      if (isDatabaseUniqueViolation(error)) {
        throw new Error('Category name already exists for this user');
      }
      throw error;
    }
  });

  fastify.delete('/:id', { schema: { params: idParamSchema } }, async (request, reply) => {
    const authUser = requireAuthUser(request);
    const { id: categoryId } = request.params as { id: string };
    const deleted = await deleteCategory(authUser.userId, categoryId);
    if (!deleted[0]) {
      throw new Error('Category not found');
    }

    return reply.status(200).send({ success: true, message: 'Category deleted' });
  });
};

export default categoriesRoutes;
