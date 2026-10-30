import { Router } from "express";

import {
  registerController,
  loginController,
  createApiKeyController,
  listApiKeysController,
  revokeApiKeyController,
} from "../controllers/auth.controller.js";

import {
  authenticateJwt,
  requireRole,
} from "../middleware/auth.middleware.js";

import { validateJson } from "../middleware/validate.js";

import {
  validateLoginBody,
  validateRegistrationBody,
} from "../middleware/auth.validation.js";

const router = Router();

router.post(
  "/register",
  validateJson,
  validateRegistrationBody,
  registerController
);

router.post(
  "/login",
  validateJson,
  validateLoginBody,
  loginController
);

router.post(
  "/api-keys",
  authenticateJwt,
  requireRole("owner"),
  createApiKeyController
);

router.get(
  "/api-keys",
  authenticateJwt,
  requireRole("owner"),
  listApiKeysController
);

router.delete(
  "/api-keys/:id",
  authenticateJwt,
  requireRole("owner"),
  revokeApiKeyController
);

export default router;
