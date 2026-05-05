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
        items: {
          type: 'object',
          required: ['itemId', 'weight'],
          additionalProperties: true,
          properties: {
            itemId: { type: 'string', minLength: 1 },
            weight: { type: 'number' },
          },
        },
      },
    },
  },
} as const;
