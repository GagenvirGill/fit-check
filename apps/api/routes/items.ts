import type { FastifyPluginAsync } from 'fastify';
import type { MultipartFile } from '@fastify/multipart';
import sizeOf from 'image-size';
import { requireAuthUser } from '#lib/auth/middleware';
import { deleteItemImageByUrl, uploadItemImage } from '#lib/cloud-storage';
import { badRequest, conflict, notFound } from '#lib/http/errors';
import { created, ok } from '#lib/http/responses';
import {
  idParamSchema,
  routeSchema,
  updateItemBodySchema,
} from '#lib/http/schemas';
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

export const parseCategoryIdsBody = (body: unknown): string[] | undefined => {
  if (typeof body !== 'object' || body === null) {
    throw Object.assign(new Error('invalid request body'), { statusCode: 400 });
  }

  if (!('categoryIds' in body)) {
    return undefined;
  }

  const categoryIds = (body as { categoryIds: unknown }).categoryIds;

  if (!Array.isArray(categoryIds)) {
    throw Object.assign(new Error('categoryIds must be an array'), { statusCode: 400 });
  }

  if (!categoryIds.every((id) => typeof id === 'string' && id.length > 0)) {
    throw Object.assign(new Error('categoryIds must contain non-empty string IDs'), { statusCode: 400 });
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
    throw Object.assign(new Error('Failed to determine image dimensions'), { statusCode: 400 });
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
      throw badRequest('Image file is required');
    }

    const createdItem = await createItemFromUpload(authUser.userId, file);
    return created(reply, 'Item created', createdItem);
  });

  fastify.patch('/:id', routeSchema({
    params: idParamSchema,
    body: updateItemBodySchema,
  }), async (request, reply) => {
    const authUser = requireAuthUser(request);
    const { id: itemId } = request.params as { id: string };

    const exists = await itemExists(authUser.userId, itemId);
    if (!exists) {
      throw notFound('Item not found');
    }

    const categoryIds = parseCategoryIdsBody(request.body);

    if (categoryIds !== undefined) {
      const validCategories = await allCategoriesBelongToUser(authUser.userId, categoryIds);
      if (!validCategories) {
        throw badRequest('One or more categories were not found for this user');
      }

      await replaceItemCategories(itemId, categoryIds);
    }

    return ok(reply, 'Item updated');
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
};

export default itemsRoutes;
