export const createCategoryBodySchema = {
  type: 'object',
  required: ['name'],
  additionalProperties: true,
  properties: {
    name: { type: 'string' },
  },
} as const;

export const updateCategoryBodySchema = {
  type: 'object',
  minProperties: 1,
  additionalProperties: true,
  properties: {
    name: { type: 'string' },
    favoriteItem: {
      anyOf: [{ type: 'string', minLength: 1 }, { type: 'null' }],
    },
  },
} as const;
