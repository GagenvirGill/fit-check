import type { OutfitLayout, OutfitLayoutItem } from '@fit-check/shared/types/models';

export const normalizeLayout = (input: unknown): OutfitLayout => {
  if (!Array.isArray(input)) {
    return [];
  }

  return input.map((row) => {
    if (!Array.isArray(row)) {
      return [];
    }

    return row
      .filter((item) => typeof item === 'object' && item !== null)
      .map((item) => item as OutfitLayoutItem);
  });
};

export const isValidLayout = (layout: unknown): layout is OutfitLayout => {
  if (!Array.isArray(layout)) {
    return false;
  }

  return layout.every((row) =>
    Array.isArray(row)
    && row.every(
      (entry) =>
        typeof entry === 'object'
        && entry !== null
        && typeof (entry as OutfitLayoutItem).itemId === 'string'
        && Number.isFinite((entry as OutfitLayoutItem).weight),
    ),
  );
};
