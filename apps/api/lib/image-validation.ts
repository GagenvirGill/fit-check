const SUPPORTED_IMAGE_MIME_TYPES = new Set([
  'image/png',
]);

const isPng = (bytes: Buffer): boolean =>
  bytes.length >= 8
  && bytes[0] === 0x89
  && bytes[1] === 0x50
  && bytes[2] === 0x4E
  && bytes[3] === 0x47
  && bytes[4] === 0x0D
  && bytes[5] === 0x0A
  && bytes[6] === 0x1A
  && bytes[7] === 0x0A;

const detectImageMimeType = (bytes: Buffer): string | null => {
  if (isPng(bytes)) {
    return 'image/png';
  }

  return null;
};

export const validateImageUpload = (
  mimeType: string,
  bytes: Buffer,
): { ok: true; normalizedMimeType: string } | { ok: false; message: string } => {
  if (!SUPPORTED_IMAGE_MIME_TYPES.has(mimeType)) {
    return { ok: false, message: 'Unsupported image content type' };
  }

  const detectedMimeType = detectImageMimeType(bytes);
  if (!detectedMimeType) {
    return { ok: false, message: 'Uploaded file is not a valid supported image' };
  }

  if (mimeType !== detectedMimeType) {
    return { ok: false, message: 'Image content does not match the provided content type' };
  }

  return {
    ok: true,
    normalizedMimeType: mimeType,
  };
};
