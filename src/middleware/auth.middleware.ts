import type {
  Request,
  Response,
  NextFunction,
  RequestHandler,
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

export const authenticateJwt: RequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authorization = req.headers.authorization;

  if (!authorization || !authorization.startsWith("Bearer ")) {
    return next(new ApiError(401, "Authentication required"));
  }

  const token = authorization.slice(7);

  if (!token) {
    return next(new ApiError(401, "Authentication token missing"));
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);

    if (
      typeof decoded === "string" ||
      typeof decoded.sub !== "string" ||
      typeof decoded.tenantId !== "string" ||
      typeof decoded.role !== "string"
    ) {
      return next(new ApiError(401, "Invalid authentication token"));
    }

    req.auth = {
      userId: decoded.sub,
      tenantId: decoded.tenantId,
      role: decoded.role,
      authMethod: "jwt",
    };

    next();
  } catch {
    next(new ApiError(401, "Invalid or expired authentication token"));
  }
};

export const authenticateApiKeyMiddleware: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
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
  } catch (error: unknown) {
    next(error);
  }
};

export function requireRole(role: string): RequestHandler {
  return (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    if (req.auth?.authMethod !== "jwt") {
      return next(
        new ApiError(403, "JWT authentication is required for this action")
      );
    }

    if (req.auth.role !== role) {
      return next(
        new ApiError(403, "You do not have permission to perform this action")
      );
    }

    next();
  };
}
