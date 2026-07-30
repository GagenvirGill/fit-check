import { Router } from "express";

import type { AuthUser } from "#packages/contracts/auth";
import type {
  CreateOutfitRequest,
  CreateOutfitResponse,
  OutfitLayout,
  OutfitLayoutItem,
  UpdateOutfitRequest,
  UpdateOutfitResponse,
} from "#packages/contracts/outfit";
import {
  createOutfit,
  deleteOutfit,
  updateOutfit,
} from "../lib/queries/outfit-queries";

type OutfitRouteLocals = {
  authUser: AuthUser;
};

type OutfitParams = {
  outfitId: string;
};

export function createOutfitRoutes() {
  const router = Router();

  router.post("/", async (request, response) => {
    const { authUser } = response.locals as OutfitRouteLocals;
    const body = request.body;
    if (!isObject(body)) {
      response
        .status(400)
        .json({ message: "Request body must be a JSON object" });
      return;
    }

    const payload = parseCreateOutfitRequest(body);
    if (!payload.ok) {
      response.status(400).json({ message: payload.message });
      return;
    }

    const created: CreateOutfitResponse | null = await createOutfit({
      userId: authUser.userId,
      ...payload.value,
    });
    if (!created) {
      response.status(404).json({ message: "Not found" });
      return;
    }

    response.status(201).json(created);
  });

  router.patch("/:outfitId", async (request, response) => {
    const { authUser } = response.locals as OutfitRouteLocals;
    const params = request.params as OutfitParams;
    const body = request.body;
    if (!isObject(body)) {
      response
        .status(400)
        .json({ message: "Request body must be a JSON object" });
      return;
    }
    if (
      !["dateWorn", "description", "layout"].some(
        (key) => body[key] !== undefined,
      )
    ) {
      response.status(400).json({
        message:
          "Request body must include at least one of: dateWorn, description, layout",
      });
      return;
    }

    const payload = parseUpdateOutfitRequest(body);
    if (!payload.ok) {
      response.status(400).json({ message: payload.message });
      return;
    }

    const updated: UpdateOutfitResponse | null = await updateOutfit({
      userId: authUser.userId,
      outfitId: params.outfitId,
      ...payload.value,
    });
    if (!updated) {
      response.status(404).json({ message: "Not found" });
      return;
    }

    response.status(200).json(updated);
  });

  router.delete("/:outfitId", async (request, response) => {
    const { authUser } = response.locals as OutfitRouteLocals;
    const params = request.params as OutfitParams;
    await deleteOutfit({ userId: authUser.userId, outfitId: params.outfitId });
    response.status(204).send();
  });

  return router;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseCreateOutfitRequest(
  body: Record<string, unknown>,
): { ok: true; value: CreateOutfitRequest } | { ok: false; message: string } {
  if (typeof body.dateWorn !== "string" || body.dateWorn.length === 0) {
    return { ok: false, message: "dateWorn is required" };
  }

  const description = parseNullableString(body.description, "description");
  if (!description.ok) {
    return description;
  }

  if (!isOutfitLayout(body.layout)) {
    return {
      ok: false,
      message:
        body.layout === undefined
          ? "layout is required"
          : "layout must be an outfit layout",
    };
  }

  return {
    ok: true,
    value: {
      dateWorn: body.dateWorn,
      description: description.value,
      layout: body.layout,
    },
  };
}

function parseUpdateOutfitRequest(
  body: Record<string, unknown>,
):
  | { ok: true; value: Partial<UpdateOutfitRequest> }
  | { ok: false; message: string } {
  const value: Partial<UpdateOutfitRequest> = {};

  if (body.dateWorn !== undefined) {
    if (typeof body.dateWorn !== "string") {
      return { ok: false, message: "dateWorn must be a string" };
    }
    value.dateWorn = body.dateWorn;
  }

  if (body.description !== undefined) {
    const description = parseNullableString(body.description, "description");
    if (!description.ok) {
      return description;
    }
    value.description = description.value;
  }

  if (body.layout !== undefined) {
    if (!isOutfitLayout(body.layout)) {
      return { ok: false, message: "layout must be an outfit layout" };
    }
    value.layout = body.layout;
  }

  return { ok: true, value };
}

function parseNullableString(
  value: unknown,
  key: string,
):
  | { ok: true; value: string | null | undefined }
  | { ok: false; message: string } {
  if (value === undefined) {
    return { ok: true, value: undefined };
  }
  if (value === null) {
    return { ok: true, value: null };
  }
  if (typeof value !== "string") {
    return { ok: false, message: `${key} must be a string or null` };
  }

  return { ok: true, value };
}

function isOutfitLayout(value: unknown): value is OutfitLayout {
  return (
    Array.isArray(value) &&
    value.every((row) => Array.isArray(row) && row.every(isOutfitLayoutItem))
  );
}

function isOutfitLayoutItem(value: unknown): value is OutfitLayoutItem {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    typeof (value as OutfitLayoutItem).itemId === "string" &&
    (value as OutfitLayoutItem).itemId.length > 0 &&
    typeof (value as OutfitLayoutItem).weight === "number" &&
    Number.isFinite((value as OutfitLayoutItem).weight)
  );
}
