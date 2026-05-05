import type { FastifyPluginAsync } from 'fastify';
import type { MultipartFile } from '@fastify/multipart';
import type {
  CreateItemResponse,
  ItemIdParam,
  UpdateItemRequest,
} from '@fit-check/shared/types/contracts/items';
import { itemIdParamSchema, updateItemBodySchema } from '@fit-check/shared/types/contracts/items';
import sizeOf from 'image-size';
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

const canDeleteItem = async (userId: string, itemId: string) => {
  const outfits = await listUserOutfitLayouts(userId);

  return !outfits.some((outfit) =>
    normalizeLayout(outfit.layout).some((row) => row.some((entry) => entry.itemId === itemId)),
  );
};

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

const createItemFromUpload = async (userId: string, file: MultipartFile) => {
  const buffer = await file.toBuffer();
  const dimensions = sizeOf(buffer);
  if (!dimensions.width || !dimensions.height) {
    return { error: 'Failed to determine image dimensions' };
  }

  const uploadedPath = await uploadItemImage(file.filename, file.mimetype, buffer);

  try {
    const inserted = await createItemRecord({
      userId,
      imagePath: uploadedPath,
      imageWidth: dimensions.width,
      imageHeight: dimensions.height,
    });

    return { item: inserted };
  } catch {
    try {
      await deleteItemImageByUrl(uploadedPath);
    } catch {
      // Best-effort cleanup to avoid orphaned objects when DB write fails.
    }
    return { error: 'Failed to create item' };
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
    const authUser = request.authUser;
    if (!authUser) {
      return reply.status(401).send({ message: 'Unauthorized' });
    }

    const file = await request.file();
    if (!file) {
      return reply.status(400).send({ message: 'Image file is required' });
    }

    const created = await createItemFromUpload(authUser.userId, file);
    if (created.error || !created.item) {
      return reply.status(400).send({ message: created.error ?? 'Failed to create item' });
    }

    const response: CreateItemResponse = created.item;
    return reply.status(201).send(response);
  });

  fastify.patch('/:id', { schema: { params: itemIdParamSchema, body: updateItemBodySchema } }, async (request, reply) => {
    const authUser = request.authUser;
    if (!authUser) {
      return reply.status(401).send({ message: 'Unauthorized' });
    }

    const { id: itemId } = request.params as ItemIdParam;

    const exists = await itemExists(authUser.userId, itemId);
    if (!exists) {
      return reply.status(404).send({ message: 'Item not found' });
    }

    const parsed = parseCategoryIds(request.body as UpdateItemRequest);
    if (parsed.error) {
      return reply.status(400).send({ message: parsed.error });
    }

    if (parsed.categoryIds !== undefined) {
      const validCategories = await allCategoriesBelongToUser(authUser.userId, parsed.categoryIds);
      if (!validCategories) {
        return reply.status(400).send({ message: 'One or more categories were not found for this user' });
      }

      await replaceItemCategories(itemId, parsed.categoryIds);
    }

    return reply.status(204).send();
  });

  fastify.delete('/:id', { schema: { params: itemIdParamSchema } }, async (request, reply) => {
    const authUser = request.authUser;
    if (!authUser) {
      return reply.status(401).send({ message: 'Unauthorized' });
    }

    const { id: itemId } = request.params as ItemIdParam;
    const item = await findOwnedItem(authUser.userId, itemId);
    if (!item) {
      return reply.status(404).send({ message: 'Item not found' });
    }

    const canDelete = await canDeleteItem(authUser.userId, itemId);
    if (!canDelete) {
      return reply.status(409).send({
        message: 'Cannot delete item while it is referenced by one or more outfits',
      });
    }

    await deleteItem(authUser.userId, itemId, item.imagePath);
    return reply.status(204).send();
  });
};

export default itemsRoutes;
