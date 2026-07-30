import { randomUUID } from "node:crypto";
import { Router } from "express";
import { imageSize } from "image-size";
import type { ItemResponse, UpdateItemRequest } from "#packages/contracts/item";
import {
  ALLOWED_IMAGE_MIME_TYPES,
  IMAGE_MIME_TYPE_EXTENSIONS,
} from "#packages/constants";
import { upload } from "../lib/upload-middleware";
import {
  createItem,
  deleteItem,
  updateItemCategories,
} from "../lib/queries/item-queries";
import { uploadS3Object } from "../lib/s3-client";

type ItemParams = {
  itemId: string;
};

export const itemRoutes = Router();

itemRoutes.post("/", upload.single("image"), async (request, response) => {
  const { authUser } = request;
  if (!request.file) {
    response.status(400).json({ message: "image file is required" });
    return;
  }

  if (!ALLOWED_IMAGE_MIME_TYPES.has(request.file.mimetype)) {
    response.status(400).json({ message: "image must be JPEG, PNG, or WebP" });
    return;
  }

  const fileExtension =
    IMAGE_MIME_TYPE_EXTENSIONS[
      request.file.mimetype as keyof typeof IMAGE_MIME_TYPE_EXTENSIONS
    ];
  const dimensions = imageSize(request.file.buffer);
  if (!dimensions.width || !dimensions.height) {
    response.status(400).json({ message: "image must be a valid image file" });
    return;
  }

  const imagePath = `items/${randomUUID()}${fileExtension}`;
  await uploadS3Object({
    key: imagePath,
    body: request.file.buffer,
    contentType: request.file.mimetype,
  });

  const body: ItemResponse = await createItem({
    userId: authUser.userId,
    imagePath,
    imageWidth: dimensions.width,
    imageHeight: dimensions.height,
  });

  response.status(201).json(body);
});

itemRoutes.patch("/:itemId", async (request, response) => {
  const { authUser } = request;
  const params = request.params as ItemParams;
  const body = request.body;
  if (!isObject(body)) {
    response
      .status(400)
      .json({ message: "Request body must be a JSON object" });
    return;
  }
  if (body.categoryIds === undefined) {
    response.status(400).json({
      message: "Request body must include at least one of: categoryIds",
    });
    return;
  }

  const categoryIds = parseStringArray(body.categoryIds);
  if (!categoryIds) {
    response
      .status(400)
      .json({ message: "categoryIds must be an array of non-empty strings" });
    return;
  }

  const payload: Partial<UpdateItemRequest> = omitUndefined({
    categoryIds,
  });

  const updated = await updateItemCategories({
    userId: authUser.userId,
    itemId: params.itemId,
    categoryIds: payload.categoryIds ?? [],
  });
  if (!updated) {
    response.status(404).json({ message: "Not found" });
    return;
  }

  response.status(204).send();
});

itemRoutes.delete("/:itemId", async (request, response) => {
  const { authUser } = request;
  const params = request.params as ItemParams;
  await deleteItem({ userId: authUser.userId, itemId: params.itemId });
  response.status(204).send();
});

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseStringArray(value: unknown): string[] | null {
  if (
    !Array.isArray(value) ||
    !value.every((item) => typeof item === "string" && item.length > 0)
  ) {
    return null;
  }

  return [...new Set(value)];
}

function omitUndefined<T extends Record<string, unknown>>(
  payload: T,
): Partial<T> {
  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined),
  ) as Partial<T>;
}
