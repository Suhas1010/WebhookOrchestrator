import type { Request, Response } from "express";

import {
  loginUser,
  registerTenant,
  createApiKey,
  listApiKeys,
  revokeApiKey,
} from "../services/auth.service.js";

import { ApiError } from "../utils/api-error.js";

export async function registerController(
  req: Request,
  res: Response
): Promise<void> {
  const { name, email, password } = req.body;

  const tenant = await registerTenant({
    name,
    email,
    password,
  });

  res.status(201).json({
    status: "success",
    message: "Tenant registered successfully",
    data: tenant,
  });
}

export async function loginController(
  req: Request,
  res: Response
): Promise<void> {
  const { email, password } = req.body;

  const user = await loginUser(email, password);

  res.status(200).json({
    status: "success",
    message: "Login successful",
    data: user,
  });
}

export async function createApiKeyController(
  req: Request,
  res: Response
): Promise<void> {
  const tenantId = req.auth?.tenantId;

  if (!tenantId) {
    throw new ApiError(401, "Authentication required");
  }

  const apiKey = await createApiKey(tenantId);

  res.status(201).json({
    status: "success",
    message: "API key created. Copy it now; it will not be shown again.",
    data: apiKey,
  });
}

export async function listApiKeysController(
  req: Request,
  res: Response
): Promise<void> {
  const tenantId = req.auth?.tenantId;

  if (!tenantId) {
    throw new ApiError(401, "Authentication required");
  }

  const keys = await listApiKeys(tenantId);

  res.status(200).json({
    status: "success",
    data: keys,
  });
}

export async function revokeApiKeyController(
  req: Request,
  res: Response
): Promise<void> {
  const tenantId = req.auth?.tenantId;

  if (!tenantId) {
    throw new ApiError(401, "Authentication required");
  }

  const keyId = req.params.id;

  if (typeof keyId !== "string" || keyId.trim() === "") {
    throw new ApiError(400, "Valid API key ID is required");
  }

  await revokeApiKey(tenantId, keyId);

  res.status(200).json({
    status: "success",
    message: "API key revoked successfully",
  });
}
