import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { env } from "./lib/get-env";
import { requireAuth } from "./lib/session";
import { authRoutes } from "./routes/auth-routes";
import { categoryRoutes } from "./routes/category-routes";
import { itemRoutes } from "./routes/item-routes";
import { outfitRoutes } from "./routes/outfit-routes";

export function createApp() {
  const app = express();

  // In prod, a reverse proxy sits in front of the API. Trust its X-Forwarded-For
  // so the rate limiter sees each client's IP rather than the proxy's.
  app.set("trust proxy", 1);

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
  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());

  app.use("/auth", authRoutes);
  app.use("/items", requireAuth, itemRoutes);
  app.use("/categories", requireAuth, categoryRoutes);
  app.use("/outfits", requireAuth, outfitRoutes);

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
