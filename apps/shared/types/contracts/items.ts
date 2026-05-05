import type { Item } from '../models';

export const updateItemBodySchema = {
  type: 'object',
  minProperties: 1,
  additionalProperties: false,
  properties: {
    categoryIds: {
      type: 'array',
      items: { type: 'string', minLength: 1 },
    },
  },
} as const;

export type UpdateItemRequest = {
  categoryIds?: string[];
};

export const itemIdParamSchema = {
  type: 'object',
  required: ['id'],
  additionalProperties: false,
  properties: {
    id: { type: 'string', minLength: 1 },
  },
} as const;

export type ItemIdParam = {
  id: string;
};

export type CreateItemResponse = Pick<Item, 'itemId' | 'imagePath' | 'imageWidth' | 'imageHeight'>;
