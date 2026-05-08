import type { OutfitLayoutModel, OutfitModel, OutfitLayoutItemModel } from '../models';

export type OutfitContract = Pick<OutfitModel, 'outfitId' | 'dateWorn' | 'description' | 'layout'>;
export type OutfitLayoutContract = OutfitLayoutModel;
export type OutfitLayoutItemContract = OutfitLayoutItemModel;

export const outfitIdParamSchema = {
  type: 'object',
  required: ['id'],
  additionalProperties: false,
  properties: {
    id: { type: 'string', minLength: 1 },
  },
} as const;

export type OutfitIdParam = {
  id: string;
};

export const createOutfitBodySchema = {
  type: 'object',
  required: ['dateWorn', 'layout'],
  additionalProperties: false,
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
        items: {
          type: 'object',
          required: ['itemId', 'weight'],
          additionalProperties: false,
          properties: {
            itemId: { type: 'string', minLength: 1 },
            weight: { type: 'number' },
          },
        },
      },
    },
  },
} as const;

export type CreateOutfitRequest = {
  dateWorn: string;
  description?: string | null;
  layout: OutfitLayoutModel;
};

export type CreateOutfitResponse = OutfitContract;
