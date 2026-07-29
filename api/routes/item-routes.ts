import { Router } from "express";
import multer from "multer";

import type { AuthUser } from "#packages/contracts/auth";
import type { CreateItemResponse, UpdateItemRequest } from "#packages/contracts/item";
import { uploadItemImage } from "../lib/cloud-storage";
import { createItem, deleteItem, updateItemCategories } from "../lib/queries/item-queries";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

type ItemRouteLocals = {
  authUser: AuthUser;
};

type ItemParams = {
  itemId: string;
};

export function createItemRoutes() {
  const router = Router();

  router.post("/", upload.single("image"), async (request, response) => {
    const { authUser } = response.locals as ItemRouteLocals;
    if (!request.file) {
      response.status(400).json({ message: "image file is required" });
      return;
    }

    const stored = await uploadItemImage(authUser.userId, {
      fileName: request.file.originalname,
      mimeType: request.file.mimetype,
      bytes: request.file.buffer,
    });
    if (!stored) {
      response.status(400).json({ message: "image must be a valid image file" });
      return;
    }

    const body: CreateItemResponse = await createItem({
      userId: authUser.userId,
      imagePath: stored.imagePath,
      imageWidth: stored.imageWidth,
      imageHeight: stored.imageHeight,
    });

    response.status(201).json(body);
  });

  router.patch("/:itemId", async (request, response) => {
    const { authUser } = response.locals as ItemRouteLocals;
    const params = request.params as ItemParams;
    const body = request.body;
    if (!isObject(body)) {
      response.status(400).json({ message: "Request body must be a JSON object" });
      return;
    }
    if (body.categoryIds === undefined) {
      response.status(400).json({ message: "Request body must include at least one of: categoryIds" });
      return;
    }

    const categoryIds = parseStringArray(body.categoryIds);
    if (!categoryIds) {
      response.status(400).json({ message: "categoryIds must be an array of non-empty strings" });
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

  router.delete("/:itemId", async (request, response) => {
    const { authUser } = response.locals as ItemRouteLocals;
    const params = request.params as ItemParams;
    await deleteItem({ userId: authUser.userId, itemId: params.itemId });
    response.status(204).send();
  });

  return router;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseStringArray(value: unknown): string[] | null {
  if (!Array.isArray(value) || !value.every((item) => typeof item === "string" && item.length > 0)) {
    return null;
  }

  return [...new Set(value)];
}

function omitUndefined<T extends Record<string, unknown>>(payload: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined),
  ) as Partial<T>;
}
