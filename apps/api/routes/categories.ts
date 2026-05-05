import type { FastifyPluginAsync } from 'fastify';
import type {
  CategoryCreateResponse,
  CategoryIdParam,
  CategoryUpdateResponse,
  CreateCategoryRequest,
  UpdateCategoryRequest,
} from '@fit-check/shared/types/contracts/categories';
import {
  categoryIdParamSchema,
  createCategoryBodySchema,
  updateCategoryBodySchema,
} from '@fit-check/shared/types/contracts/categories';
import {
  createCategory,
  deleteCategory,
  updateCategory,
} from '#lib/database/queries/categories';
import { isDatabaseQueryError } from '#lib/database/query-error';

const categoriesRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post('/', { schema: { body: createCategoryBodySchema } }, async (request, reply) => {
    const authUser = request.authUser;
    if (!authUser) {
      return reply.status(401).send({ message: 'Unauthorized' });
    }

    try {
      const { name } = request.body as CreateCategoryRequest;
      const category: CategoryCreateResponse = await createCategory(authUser.userId, name);
      return reply.status(201).send(category);
    } catch (error) {
      if (isDatabaseQueryError(error)) {
        return reply.status(error.statusCode).send({ message: error.message });
      }
      throw error;
    }
  });

  fastify.patch(
    '/:id',
    { schema: { params: categoryIdParamSchema, body: updateCategoryBodySchema } },
    async (request, reply) => {
      const authUser = request.authUser;
      if (!authUser) {
        return reply.status(401).send({ message: 'Unauthorized' });
      }

      const { id: categoryId } = request.params as CategoryIdParam;
      try {
        const updates = request.body as UpdateCategoryRequest;
        const response: CategoryUpdateResponse = await updateCategory(authUser.userId, categoryId, updates);
        return reply.status(200).send(response);
      } catch (error) {
        if (isDatabaseQueryError(error)) {
          return reply.status(error.statusCode).send({ message: error.message });
        }
        throw error;
      }
    },
  );

  fastify.delete('/:id', { schema: { params: categoryIdParamSchema } }, async (request, reply) => {
    const authUser = request.authUser;
    if (!authUser) {
      return reply.status(401).send({ message: 'Unauthorized' });
    }

    const { id: categoryId } = request.params as CategoryIdParam;
    try {
      await deleteCategory(authUser.userId, categoryId);
      return reply.status(204).send();
    } catch (error) {
      if (isDatabaseQueryError(error)) {
        return reply.status(error.statusCode).send({ message: error.message });
      }
      throw error;
    }
  });
};

export default categoriesRoutes;
