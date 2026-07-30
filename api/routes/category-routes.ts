import { Router } from "express";

import type { AuthUser } from "#packages/contracts/auth";
import type {
  CreateCategoryRequest,
  CreateCategoryResponse,
  UpdateCategoryRequest,
  UpdateCategoryResponse,
} from "#packages/contracts/category";
import {
  createCategory,
  deleteCategory,
  updateCategory,
} from "../lib/queries/category-queries";

type CategoryRouteLocals = {
  authUser: AuthUser;
};

type CategoryParams = {
  categoryId: string;
};

export const categoryRoutes = Router();

categoryRoutes.post("/", async (request, response) => {
  const { authUser } = response.locals as CategoryRouteLocals;
  const body = request.body;
  if (!isObject(body)) {
    response
      .status(400)
      .json({ message: "Request body must be a JSON object" });
    return;
  }

  const name = parseRequiredString(body.name);
  if (name === null) {
    response.status(400).json({ message: "name is required" });
    return;
  }

  const payload: CreateCategoryRequest = {
    name,
  };
  const created: CreateCategoryResponse = await createCategory({
    userId: authUser.userId,
    name: payload.name,
  });

  response.status(201).json(created);
});

categoryRoutes.patch("/:categoryId", async (request, response) => {
  const { authUser } = response.locals as CategoryRouteLocals;
  const params = request.params as CategoryParams;
  const body = request.body;
  if (!isObject(body)) {
    response
      .status(400)
      .json({ message: "Request body must be a JSON object" });
    return;
  }
  if (
    !["name", "favoriteItem", "itemIds"].some((key) => body[key] !== undefined)
  ) {
    response.status(400).json({
      message:
        "Request body must include at least one of: name, favoriteItem, itemIds",
    });
    return;
  }

  const payload = parseUpdateCategoryRequest(body);
  if (!payload.ok) {
    response.status(400).json({ message: payload.message });
    return;
  }
  const updated: UpdateCategoryResponse | null = await updateCategory({
    userId: authUser.userId,
    categoryId: params.categoryId,
    ...payload.value,
  });
  if (!updated) {
    response.status(404).json({ message: "Not found" });
    return;
  }

  response.status(200).json(updated);
});

categoryRoutes.delete("/:categoryId", async (request, response) => {
  const { authUser } = response.locals as CategoryRouteLocals;
  const params = request.params as CategoryParams;
  await deleteCategory({
    userId: authUser.userId,
    categoryId: params.categoryId,
  });
  response.status(204).send();
});

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseRequiredString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function parseUpdateCategoryRequest(
  body: Record<string, unknown>,
):
  | { ok: true; value: Partial<UpdateCategoryRequest> }
  | { ok: false; message: string } {
  const value: Partial<UpdateCategoryRequest> = {};

  if (body.name !== undefined) {
    if (typeof body.name !== "string") {
      return { ok: false, message: "name must be a string" };
    }
    value.name = body.name;
  }

  if (body.favoriteItem !== undefined) {
    if (body.favoriteItem !== null && typeof body.favoriteItem !== "string") {
      return { ok: false, message: "favoriteItem must be a string or null" };
    }
    value.favoriteItem = body.favoriteItem;
  }

  if (body.itemIds !== undefined) {
    if (
      !Array.isArray(body.itemIds) ||
      !body.itemIds.every((item) => typeof item === "string" && item.length > 0)
    ) {
      return {
        ok: false,
        message: "itemIds must be an array of non-empty strings",
      };
    }
    value.itemIds = [...new Set(body.itemIds)];
  }

  return { ok: true, value };
}
