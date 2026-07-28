import { ApiError } from "./api-error";
import type { OutfitLayout, OutfitLayoutItem } from "../../types/models";

export function requireOutfitLayout(body: Record<string, unknown>, key: string): OutfitLayout {
  const value = optionalOutfitLayout(body, key);
  if (value === undefined) {
    throw new ApiError(400, `${key} is required`);
  }

  return value;
}

export function optionalOutfitLayout(
  body: Record<string, unknown>,
  key: string,
): OutfitLayout | undefined {
  const value = body[key];
  if (value === undefined) {
    return undefined;
  }
  if (!isOutfitLayout(value)) {
    throw new ApiError(400, `${key} must be an outfit layout`);
  }

  return value;
}

function isOutfitLayout(value: unknown): value is OutfitLayout {
  return Array.isArray(value)
    && value.every((row) =>
      Array.isArray(row)
      && row.every(isOutfitLayoutItem),
    );
}

function isOutfitLayoutItem(value: unknown): value is OutfitLayoutItem {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }

  const entry = value as Record<string, unknown>;
  return typeof entry.itemId === "string"
    && entry.itemId.length > 0
    && typeof entry.weight === "number"
    && Number.isFinite(entry.weight);
}
