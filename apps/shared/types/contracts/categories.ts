import type { Category } from '../models';

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
  },
} as const;

export type UpdateCategoryRequest = {
  name?: string;
  favoriteItem?: string | null;
};

export type CategoryCreateResponse = Pick<Category, 'categoryId' | 'name' | 'favoriteItem'>;

export type CategoryUpdateResponse = Pick<Category, 'categoryId' | 'name' | 'favoriteItem'>;
