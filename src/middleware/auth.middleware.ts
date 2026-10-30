import type {
  Request,
  Response,
  NextFunction,
} from "express";

import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { ApiError } from "../utils/api-error.js";
import { authenticateApiKey } from "../services/auth.service.js";

declare global {
  namespace Express {
    interface Request {
      auth?: {
        userId?: string;
        tenantId: string;
        role?: string;
        apiKeyId?: string;
        authMethod: "jwt" | "api-key";
      };
    }
  }
}

export function authenticateJwt(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  const authorization = req.headers.authorization;

  if (!authorization?.startsWith("Bearer ")) {
    next(new ApiError(401, "Authentication required"));
    return;
  }

  try {
    const token = authorization.slice(7);
    const payload = jwt.verify(token, env.JWT_SECRET);

    if (
      typeof payload === "string" ||
      typeof payload.sub !== "string" ||
      typeof payload.tenantId !== "string" ||
      typeof payload.role !== "string"
    ) {
      throw new Error("Invalid token payload");
    }

    req.auth = {
      userId: payload.sub,
      tenantId: payload.tenantId,
      role: payload.role,
      authMethod: "jwt",
    };

    next();
  } catch {
    next(new ApiError(401, "Invalid or expired token"));
  }
}

export async function authenticateApiKeyMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const key = req.header("x-api-key");

    if (!key) {
      throw new ApiError(401, "API key required");
    }

    const apiKey = await authenticateApiKey(key);

    req.auth = {
      tenantId: apiKey.tenantId,
      apiKeyId: apiKey.apiKeyId,
      authMethod: "api-key",
    };

    next();
  } catch (error) {
    next(error);
  }
}
