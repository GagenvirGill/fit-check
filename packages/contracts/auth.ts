export type AuthUser = {
  userId: string;
  email: string;
  provider: string;
};

export type GetCurrentUserResponse = AuthUser;
