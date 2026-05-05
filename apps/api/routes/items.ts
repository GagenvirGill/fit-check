import type { FastifyPluginAsync } from 'fastify';
import type { MultipartFile } from '@fastify/multipart';
import sizeOf from 'image-size';
import { requireAuthUser } from '#lib/auth/middleware';
import { deleteItemImageByUrl, uploadItemImage } from '#lib/cloud-storage';
import { normalizeLayout } from '#lib/outfit-layout';
import {
  allCategoriesBelongToUser,
  createItemRecord,
  deleteOwnedItem,
  findOwnedItem,
  itemExists,
  listUserOutfitLayouts,
  replaceItemCategories,
} from '#lib/database/queries/items';
import { idParamSchema } from '#types/schemas/shared';
import { updateItemBodySchema } from '#types/schemas/items';

export const parseCategoryIdsBody = (body: unknown): string[] | undefined => {
  if (typeof body !== 'object' || body === null) {
    throw new Error('invalid request body');
  }

  if (!('categoryIds' in body)) {
    return undefined;
  }

  const categoryIds = (body as { categoryIds: unknown }).categoryIds;

  if (!Array.isArray(categoryIds)) {
    throw new Error('categoryIds must be an array');
  }

  if (!categoryIds.every((id) => typeof id === 'string' && id.length > 0)) {
    throw new Error('categoryIds must contain non-empty string IDs');
  }

  return [...new Set(categoryIds)];
};

const canDeleteItem = async (userId: string, itemId: string) => {
  const outfits = await listUserOutfitLayouts(userId);

  return !outfits.some((outfit) =>
    normalizeLayout(outfit.layout).some((row) => row.some((entry) => entry.itemId === itemId)),
  );
};

const createItemFromUpload = async (userId: string, file: MultipartFile) => {
  const buffer = await file.toBuffer();
  const dimensions = sizeOf(buffer);
  if (!dimensions.width || !dimensions.height) {
    throw new Error('Failed to determine image dimensions');
  }

  const uploadedPath = await uploadItemImage(file.filename, file.mimetype, buffer);

  try {
    const inserted = await createItemRecord({
      userId,
      imagePath: uploadedPath,
      imageWidth: dimensions.width,
      imageHeight: dimensions.height,
    });

    return inserted;
  } catch (error) {
    try {
      await deleteItemImageByUrl(uploadedPath);
    } catch {
      // Best-effort cleanup to avoid orphaned objects when DB write fails.
    }
    throw error;
  }
};

const deleteItem = async (userId: string, itemId: string, imagePath: string) => {
  await deleteOwnedItem(userId, itemId);

  try {
    await deleteItemImageByUrl(imagePath);
  } catch {
    // The source of truth is the DB row removal; storage cleanup can be retried later.
  }
};

const itemsRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post('/', async (request, reply) => {
    const authUser = requireAuthUser(request);
    const file = await request.file();
    if (!file) {
      throw new Error('Image file is required');
    }

    const createdItem = await createItemFromUpload(authUser.userId, file);
    return reply.status(201).send({ success: true, message: 'Item created', data: createdItem });
  });

  fastify.patch('/:id', { schema: { params: idParamSchema, body: updateItemBodySchema } }, async (request, reply) => {
    const authUser = requireAuthUser(request);
    const { id: itemId } = request.params as { id: string };

    const exists = await itemExists(authUser.userId, itemId);
    if (!exists) {
      throw new Error('Item not found');
    }

    const categoryIds = parseCategoryIdsBody(request.body);

    if (categoryIds !== undefined) {
      const validCategories = await allCategoriesBelongToUser(authUser.userId, categoryIds);
      if (!validCategories) {
        throw new Error('One or more categories were not found for this user');
      }

      await replaceItemCategories(itemId, categoryIds);
    }

    return reply.status(200).send({ success: true, message: 'Item updated' });
  });

  fastify.delete('/:id', { schema: { params: idParamSchema } }, async (request, reply) => {
    const authUser = requireAuthUser(request);
    const { id: itemId } = request.params as { id: string };
    const item = await findOwnedItem(authUser.userId, itemId);
    if (!item) {
      throw new Error('Item not found');
    }

    const canDelete = await canDeleteItem(authUser.userId, itemId);
    if (!canDelete) {
      throw new Error('Cannot delete item while it is referenced by one or more outfits');
    }

    await deleteItem(authUser.userId, itemId, item.imagePath);
    return reply.status(200).send({ success: true, message: 'Item deleted' });
  });
};

export default itemsRoutes;
