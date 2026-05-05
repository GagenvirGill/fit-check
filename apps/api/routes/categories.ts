import type { FastifyPluginAsync } from 'fastify';
import { requireAuthUser } from '#lib/auth/middleware';
import { badRequest, conflict, notFound } from '#lib/http/errors';
import { created, ok } from '#lib/http/responses';
import {
  createCategoryBodySchema,
  idParamSchema,
  routeSchema,
  updateCategoryBodySchema,
} from '#lib/http/schemas';
import { isDatabaseUniqueViolation } from '#lib/database-errors';
import {
  categoryNameExists,
  createCategory,
  deleteCategory,
  updateCategory,
  userOwnsItem,
} from '#lib/database/queries/categories';

type CategoryUpdateBody = {
  name?: string;
  favoriteItem?: string | null;
};

const categoriesRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post('/', routeSchema({
    body: createCategoryBodySchema,
  }), async (request, reply) => {
    const authUser = requireAuthUser(request);
    const { name: rawName } = request.body as { name: string };
    const name = rawName.trim();
    if (!name) {
      throw badRequest('Category name is required');
    }

    if (await categoryNameExists(authUser.userId, name)) {
      throw conflict('Category name already exists for this user');
    }

    try {
      const category = await createCategory(authUser.userId, name);
      return created(reply, `Category ${name} created`, category[0]);
    } catch (error) {
      if (isDatabaseUniqueViolation(error)) {
        throw conflict('Category name already exists for this user');
      }
      throw error;
    }
  });

  fastify.patch('/:id', routeSchema({
    params: idParamSchema,
    body: updateCategoryBodySchema,
  }), async (request, reply) => {
    const authUser = requireAuthUser(request);
    const { id: categoryId } = request.params as { id: string };
    const body = request.body as CategoryUpdateBody;
    const updates: { name?: string; favoriteItem?: string | null } = {};

    if (body.name !== undefined) {
      const name = body.name.trim();
      if (!name) {
        throw badRequest('Category name cannot be empty');
      }
      updates.name = name;
    }

    if (body.favoriteItem !== undefined) {
      if (body.favoriteItem === null) {
        updates.favoriteItem = null;
      } else {
        const ownsItem = await userOwnsItem(authUser.userId, body.favoriteItem);
        if (!ownsItem) {
          throw badRequest('favoriteItem must reference an item owned by the user');
        }
        updates.favoriteItem = body.favoriteItem;
      }
    }

    if (Object.keys(updates).length === 0) {
      throw badRequest('No valid category updates provided');
    }

    try {
      const category = await updateCategory(authUser.userId, categoryId, updates);
      if (!category[0]) {
        throw notFound('Category not found');
      }
      return ok(reply, 'Category updated', category[0]);
    } catch (error) {
      if (isDatabaseUniqueViolation(error)) {
        throw conflict('Category name already exists for this user');
      }
      throw error;
    }
  });

  fastify.delete('/:id', routeSchema({
    params: idParamSchema,
  }), async (request, reply) => {
    const authUser = requireAuthUser(request);
    const { id: categoryId } = request.params as { id: string };
    const deleted = await deleteCategory(authUser.userId, categoryId);
    if (!deleted[0]) {
      throw notFound('Category not found');
    }

    return ok(reply, 'Category deleted');
  });
};

export default categoriesRoutes;
