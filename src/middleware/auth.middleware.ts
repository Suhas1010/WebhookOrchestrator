import type {
  Request,
  Response,
  NextFunction,
} from "express";

import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { ApiError } from "../utils/api-error.js";
import { authenticateApiKey } from "../services/auth.service.js";

// ─────────────────────────────────────────────
// EXPRESS REQUEST TYPE EXTENSION
// ─────────────────────────────────────────────



// ─────────────────────────────────────────────
// JWT AUTHENTICATION
// ─────────────────────────────────────────────

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

// ─────────────────────────────────────────────
// API KEY AUTHENTICATION
// ─────────────────────────────────────────────

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

// ─────────────────────────────────────────────
// ROLE-BASED AUTHORIZATION
// ─────────────────────────────────────────────

export function requireRole(role: string) {
  return (
    req: Request,
    _res: Response,
    next: NextFunction
  ): void => {
    if (!req.auth) {
      next(new ApiError(401, "Authentication required"));
      return;
    }

    if (req.auth.authMethod !== "jwt") {
      next(new ApiError(403, "JWT authentication required"));
      return;
    }

    if (req.auth.role !== role) {
      next(new ApiError(403, "Insufficient permissions"));
      return;
    }

    next();
  };
}
