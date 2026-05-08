import type { CategoryModel } from '../models';

export type CategoryContract = Pick<CategoryModel, 'categoryId' | 'name' | 'favoriteItem'>;

export const createCategoryBodySchema = {
  type: 'object',
  required: ['name'],
  additionalProperties: false,
  properties: {
    name: { type: 'string' },
  },
} as const;

export type CreateCategoryRequest = {
  name: string;
};

export const categoryIdParamSchema = {
  type: 'object',
  required: ['id'],
  additionalProperties: false,
  properties: {
    id: { type: 'string', minLength: 1 },
  },
} as const;

export type CategoryIdParam = {
  id: string;
};

export const updateCategoryBodySchema = {
  type: 'object',
  minProperties: 1,
  additionalProperties: false,
  properties: {
    name: { type: 'string' },
    favoriteItem: {
      anyOf: [{ type: 'string', minLength: 1 }, { type: 'null' }],
    },
    itemIds: {
      type: 'array',
      items: { type: 'string', minLength: 1 },
    },
  },
} as const;

export type UpdateCategoryRequest = {
  name?: string;
  favoriteItem?: string | null;
  itemIds?: string[];
};

export type CategoryCreateResponse = CategoryContract;

export type CategoryUpdateResponse = CategoryContract;
