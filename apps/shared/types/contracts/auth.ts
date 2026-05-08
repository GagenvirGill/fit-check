import type { UserModel } from '../models';

export type UserContract = Pick<UserModel, 'userId' | 'email' | 'provider'>;

export const googleCallbackQuerySchema = {
  type: 'object',
  required: ['code', 'state'],
  properties: {
    code: { type: 'string', minLength: 1 },
    state: { type: 'string', minLength: 1 },
  },
} as const;

export type GoogleCallbackQuery = {
  code: string;
  state: string;
};

export type AuthMeResponse = UserContract;
