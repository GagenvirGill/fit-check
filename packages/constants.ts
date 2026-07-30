export const IMAGE_MIME_TYPE_EXTENSIONS = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
} as const;

export const ALLOWED_IMAGE_MIME_TYPES = new Set(
  Object.keys(IMAGE_MIME_TYPE_EXTENSIONS),
);
