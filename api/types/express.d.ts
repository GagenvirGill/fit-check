import type { AuthUser } from "#packages/contracts/auth";

declare global {
  namespace Express {
    interface Request {
      authUser: AuthUser;
    }
  }
}
