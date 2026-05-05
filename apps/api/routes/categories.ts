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
  categoryNameExists,
  createCategory,
  deleteCategory,
  updateCategory,
  userOwnsItem,
} from '#lib/database/queries/categories';

const isUniqueViolation = (error: unknown): boolean =>
  typeof error === 'object' && error !== null && (error as { code?: unknown }).code === '23505';

type CategoryUpdateParseResult =
  | { ok: true; updates: { name?: string; favoriteItem?: string | null } }
  | { ok: false; message: string };

const buildCategoryUpdates = (body: UpdateCategoryRequest) => {
  const updates: { name?: string; favoriteItem?: string | null } = {};

  if (body.name !== undefined) {
    const name = body.name.trim();
    if (!name) {
      const errorResult: CategoryUpdateParseResult = {
        ok: false,
        message: 'Category name cannot be empty',
      };
      return errorResult;
    }
    updates.name = name;
  }

  if (body.favoriteItem !== undefined) {
    updates.favoriteItem = body.favoriteItem;
  }

  const successResult: CategoryUpdateParseResult = { ok: true, updates };
  return successResult;
};

const categoriesRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post('/', { schema: { body: createCategoryBodySchema } }, async (request, reply) => {
    const authUser = request.authUser;
    if (!authUser) {
      return reply.status(401).send({ message: 'Unauthorized' });
    }

    const { name: rawName } = request.body as CreateCategoryRequest;
    const name = rawName.trim();
    if (!name) {
      return reply.status(400).send({ message: 'Category name is required' });
    }

    if (await categoryNameExists(authUser.userId, name)) {
      return reply.status(409).send({ message: 'Category name already exists for this user' });
    }

    try {
      const inserted = await createCategory(authUser.userId, name);
      const category: CategoryCreateResponse = inserted[0];
      return reply.status(201).send(category);
    } catch (error) {
      if (isUniqueViolation(error)) {
        return reply.status(409).send({ message: 'Category name already exists for this user' });
      }
      return reply.status(500).send({ message: 'Failed to create category' });
    }
  });

  fastify.patch('/:id', { schema: { params: categoryIdParamSchema, body: updateCategoryBodySchema } }, async (request, reply) => {
    const authUser = request.authUser;
    if (!authUser) {
      return reply.status(401).send({ message: 'Unauthorized' });
    }

    const { id: categoryId } = request.params as CategoryIdParam;
    const body = request.body as UpdateCategoryRequest;
    const parsed = buildCategoryUpdates(body);

    if (!parsed.ok) {
      return reply.status(400).send({ message: parsed.message });
    }

    const updates = parsed.updates;
    if (updates.favoriteItem !== undefined && updates.favoriteItem !== null) {
      const ownsItem = await userOwnsItem(authUser.userId, updates.favoriteItem);
      if (!ownsItem) {
        return reply.status(400).send({
          message: 'favoriteItem must reference an item owned by the user',
        });
      }
    }

    if (Object.keys(updates).length === 0) {
      return reply.status(400).send({ message: 'No valid category updates provided' });
    }

    try {
      const category = await updateCategory(authUser.userId, categoryId, updates);
      if (!category[0]) {
        return reply.status(404).send({ message: 'Category not found' });
      }

      const response: CategoryUpdateResponse = category[0];
      return reply.status(200).send(response);
    } catch (error) {
      if (isUniqueViolation(error)) {
        return reply.status(409).send({ message: 'Category name already exists for this user' });
      }

      return reply.status(500).send({ message: 'Failed to update category' });
    }
  });

  fastify.delete('/:id', { schema: { params: categoryIdParamSchema } }, async (request, reply) => {
    const authUser = request.authUser;
    if (!authUser) {
      return reply.status(401).send({ message: 'Unauthorized' });
    }

    const { id: categoryId } = request.params as CategoryIdParam;
    const deleted = await deleteCategory(authUser.userId, categoryId);
    if (!deleted[0]) {
      return reply.status(404).send({ message: 'Category not found' });
    }

    return reply.status(204).send();
  });
};

export default categoriesRoutes;
