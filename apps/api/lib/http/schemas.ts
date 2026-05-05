import type { FastifySchema } from 'fastify';

const stringId = {
  type: 'string',
  minLength: 1,
} as const;

export const idParamSchema = {
  type: 'object',
  required: ['id'],
  additionalProperties: false,
  properties: {
    id: stringId,
  },
} as const;

export const categoryFilterQuerySchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    categories: {
      type: 'string',
    },
  },
} as const;

export const googleCallbackQuerySchema = {
  type: 'object',
  required: ['code', 'state'],
  additionalProperties: false,
  properties: {
    code: stringId,
    state: stringId,
  },
} as const;

export const createCategoryBodySchema = {
  type: 'object',
  required: ['name'],
  additionalProperties: true,
  properties: {
    name: {
      type: 'string',
    },
  },
} as const;

export const updateCategoryBodySchema = {
  type: 'object',
  minProperties: 1,
  additionalProperties: true,
  properties: {
    name: {
      type: 'string',
    },
    favoriteItem: {
      anyOf: [stringId, { type: 'null' }],
    },
  },
} as const;

export const replaceItemCategoriesBodySchema = {
  type: 'object',
  required: ['categories'],
  additionalProperties: true,
  properties: {
    categories: {
      type: 'array',
      items: stringId,
    },
  },
} as const;

const outfitLayoutItemSchema = {
  type: 'object',
  required: ['itemId', 'weight'],
  additionalProperties: true,
  properties: {
    itemId: stringId,
    weight: {
      type: 'number',
    },
  },
} as const;

export const createOutfitBodySchema = {
  type: 'object',
  required: ['dateWorn', 'layout'],
  additionalProperties: true,
  properties: {
    dateWorn: {
      type: 'string',
      pattern: '^\\d{4}-\\d{2}-\\d{2}$',
    },
    description: {
      anyOf: [{ type: 'string' }, { type: 'null' }],
    },
    layout: {
      type: 'array',
      items: {
        type: 'array',
        items: outfitLayoutItemSchema,
      },
    },
  },
} as const;

export const outfitSearchQuerySchema = {
  type: 'object',
  required: ['query'],
  additionalProperties: false,
  properties: {
    query: {
      type: 'string',
    },
  },
} as const;

export const routeSchema = (schema: FastifySchema): { schema: FastifySchema } => ({ schema });
