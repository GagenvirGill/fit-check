import type { User } from '../models';

export const googleCallbackQuerySchema = {
  type: 'object',
  required: ['code', 'state'],
  additionalProperties: false,
  properties: {
    code: { type: 'string', minLength: 1 },
    state: { type: 'string', minLength: 1 },
  },
} as const;

export type GoogleCallbackQuery = {
  code: string;
  state: string;
};

export type AuthMeResponse = Pick<User, 'userId' | 'email' | 'provider'>;
