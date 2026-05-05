export const googleCallbackQuerySchema = {
  type: 'object',
  required: ['code', 'state'],
  additionalProperties: false,
  properties: {
    code: { type: 'string', minLength: 1 },
    state: { type: 'string', minLength: 1 },
  },
} as const;
