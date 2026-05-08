import type { FastifyPluginAsync } from 'fastify';
import type {
  CreateItemResponse,
  ItemIdParam,
  UpdateItemRequest,
} from '@fit-check/shared/types/contracts/items';
import { itemIdParamSchema, updateItemBodySchema } from '@fit-check/shared/types/contracts/items';
import sizeOf from 'image-size';
import { deleteItemImageByKey, uploadItemImage } from '#lib/cloud-storage';
import { getRequiredMultipartFile } from '#lib/multipart';
import { validateImageUpload } from '#lib/image-validation';
import {
  createItemRecord,
  deleteOwnedItem,
  replaceOwnedItemCategories,
} from '#lib/database/queries/items';
import { isDatabaseQueryError } from '#lib/database/query-error';

const parseCategoryIds = (body: UpdateItemRequest): { categoryIds?: string[]; error?: string } => {
  if (body.categoryIds === undefined) {
    return { categoryIds: undefined };
  }

  if (!Array.isArray(body.categoryIds)) {
    return { error: 'categoryIds must be an array' };
  }

  if (!body.categoryIds.every((id) => typeof id === 'string' && id.length > 0)) {
    return { error: 'categoryIds must contain non-empty string IDs' };
  }

  return { categoryIds: [...new Set(body.categoryIds)] };
};

const itemsRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post('/', async (request, reply) => {
    const authUser = request.authUser;
    if (!authUser) {
      return reply.status(401).send({ message: 'Unauthorized' });
    }

    const fileResult = await getRequiredMultipartFile(request);
    if (fileResult.error || !fileResult.file) {
      return reply.status(400).send({ message: fileResult.error ?? 'Image file is required' });
    }

    const file = fileResult.file;
    const buffer = await file.toBuffer();
    const imageValidation = validateImageUpload(file.mimetype, buffer);
    if (!imageValidation.ok) {
      return reply.status(400).send({ message: imageValidation.message });
    }

    const dimensions = sizeOf(buffer);
    if (!dimensions.width || !dimensions.height) {
      return reply.status(400).send({ message: 'Failed to determine image dimensions' });
    }

    const uploadedImageKey = await uploadItemImage(file.filename, imageValidation.normalizedMimeType, buffer);

    try {
      const created = await createItemRecord({
        userId: authUser.userId,
        imagePath: uploadedImageKey,
        imageWidth: dimensions.width,
        imageHeight: dimensions.height,
      });

      const response: CreateItemResponse = created;
      return reply.status(201).send(response);
    } catch (error) {
      try {
        await deleteItemImageByKey(uploadedImageKey);
      } catch {
        // Best-effort cleanup to avoid orphaned objects when DB write fails.
      }

      if (isDatabaseQueryError(error)) {
        return reply.status(error.statusCode).send({ message: error.message });
      }
      throw error;
    }
  });

  fastify.patch(
    '/:id',
    { schema: { params: itemIdParamSchema, body: updateItemBodySchema } },
    async (request, reply) => {
      const authUser = request.authUser;
      if (!authUser) {
        return reply.status(401).send({ message: 'Unauthorized' });
      }

      const { id: itemId } = request.params as ItemIdParam;

      const parsed = parseCategoryIds(request.body as UpdateItemRequest);
      if (parsed.error) {
        return reply.status(400).send({ message: parsed.error });
      }

      if (parsed.categoryIds !== undefined) {
        try {
          await replaceOwnedItemCategories(authUser.userId, itemId, parsed.categoryIds);
        } catch (error) {
          if (isDatabaseQueryError(error)) {
            return reply.status(error.statusCode).send({ message: error.message });
          }
          throw error;
        }
      }

      return reply.status(204).send();
    },
  );

  fastify.delete('/:id', { schema: { params: itemIdParamSchema } }, async (request, reply) => {
    const authUser = request.authUser;
    if (!authUser) {
      return reply.status(401).send({ message: 'Unauthorized' });
    }

    const { id: itemId } = request.params as ItemIdParam;
    try {
      const { imagePath } = await deleteOwnedItem(authUser.userId, itemId);
      try {
        await deleteItemImageByKey(imagePath);
      } catch {
        // The source of truth is the DB row removal; storage cleanup can be retried later.
      }
      return reply.status(204).send();
    } catch (error) {
      if (isDatabaseQueryError(error)) {
        return reply.status(error.statusCode).send({ message: error.message });
      }
      throw error;
    }
  });
};

export default itemsRoutes;
