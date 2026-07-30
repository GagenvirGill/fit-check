import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import jwt from "jsonwebtoken";

import type { AuthUser } from "#packages/contracts/auth";
import { env } from "./lib/get-env";
import { getUserById } from "./lib/queries/auth-queries";
import { createAuthRoutes } from "./routes/auth-routes";
import { createCategoryRoutes } from "./routes/category-routes";
import { createItemRoutes } from "./routes/item-routes";
import { createOutfitRoutes } from "./routes/outfit-routes";

type SessionToken = {
  userId: string;
};

const SESSION_COOKIE_NAME = "fit_check_session";

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: env.frontendUrl, credentials: true }));
  app.use(
    rateLimit({
      windowMs: 60_000,
      limit: 300,
      standardHeaders: true,
      legacyHeaders: false,
    }),
  );
  app.use(express.json());
  app.use(cookieParser());

  const requireAuth = async (
    request: express.Request,
    response: express.Response,
    next: express.NextFunction,
  ) => {
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

    response.locals.authUser = authUser satisfies AuthUser;
    next();
  };

  app.use("/api/auth", createAuthRoutes());
  app.use("/api/items", requireAuth, createItemRoutes());
  app.use("/api/categories", requireAuth, createCategoryRoutes());
  app.use("/api/outfits", requireAuth, createOutfitRoutes());

  app.use((_request, response) => {
    response.status(404).json({ message: "Not found" });
  });

  app.use(
    (
      _error: unknown,
      _request: express.Request,
      response: express.Response,
      _next: express.NextFunction,
    ) => {
      response.status(500).json({ message: "Internal server error" });
    },
  );

  return app;
}
