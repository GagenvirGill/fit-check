import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

import { env } from "./get-env";
import { getUserById } from "./queries/auth-queries";

export const SESSION_COOKIE_NAME = "fit_check_session";

type SessionToken = {
  userId: string;
};

export async function requireAuth(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  const sessionCookie = request.cookies[SESSION_COOKIE_NAME];
  if (typeof sessionCookie !== "string" || sessionCookie.length === 0) {
    response.status(401).json({ message: "Unauthorized" });
    return;
  }

  let decoded: SessionToken;
  try {
    decoded = jwt.verify(sessionCookie, env.jwtSecret) as SessionToken;
  } catch {
    response.status(401).json({ message: "Unauthorized" });
    return;
  }

  const authUser = await getUserById(decoded.userId);
  if (!authUser) {
    response.status(401).json({ message: "Unauthorized" });
    return;
  }

  request.authUser = authUser;
  next();
}
