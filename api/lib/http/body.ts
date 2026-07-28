import { ApiError } from "./api-error";

export function asObject(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new ApiError(400, "Request body must be a JSON object");
  }

  return value as Record<string, unknown>;
}

export function requireString(body: Record<string, unknown>, key: string): string {
  const value = optionalString(body, key);
  if (value === undefined || value.length === 0) {
    throw new ApiError(400, `${key} is required`);
  }

  return value;
}

export function optionalString(body: Record<string, unknown>, key: string): string | undefined {
  const value = body[key];
  if (value === undefined) {
    return undefined;
  }
  if (typeof value !== "string") {
    throw new ApiError(400, `${key} must be a string`);
  }

  return value;
}

export function optionalNullableString(
  body: Record<string, unknown>,
  key: string,
): string | null | undefined {
  const value = body[key];
  if (value === undefined) {
    return undefined;
  }
  if (value === null) {
    return null;
  }
  if (typeof value !== "string") {
    throw new ApiError(400, `${key} must be a string or null`);
  }

  return value;
}

export function optionalStringArray(body: Record<string, unknown>, key: string): string[] | undefined {
  const value = body[key];
  if (value === undefined) {
    return undefined;
  }
  if (!Array.isArray(value) || !value.every((item) => typeof item === "string" && item.length > 0)) {
    throw new ApiError(400, `${key} must be an array of non-empty strings`);
  }

  return [...new Set(value)];
}

export function requireAny(body: Record<string, unknown>, keys: string[]) {
  if (!keys.some((key) => body[key] !== undefined)) {
    throw new ApiError(400, `Request body must include at least one of: ${keys.join(", ")}`);
  }
}

export function omitUndefined<T extends Record<string, unknown>>(payload: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined),
  ) as Partial<T>;
}
