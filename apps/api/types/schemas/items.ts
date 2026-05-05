export const updateItemBodySchema = {
  type: 'object',
  minProperties: 1,
  additionalProperties: true,
  properties: {
    categoryIds: {
      type: 'array',
      items: { type: 'string', minLength: 1 },
    },
  },
} as const;
