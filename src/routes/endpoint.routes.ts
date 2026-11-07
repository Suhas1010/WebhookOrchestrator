import { Router } from "express";

import {
  createEndpointController,
  listEndpointsController,
  getEndpointController,
  updateEndpointController,
  deleteEndpointController,
} from "../controllers/endpoint.controller.js";

import { authenticateApiKeyMiddleware } from "../middleware/auth.middleware.js";

const router = Router();

// CREATE ENDPOINT
router.post(
  "/",
  authenticateApiKeyMiddleware,
  createEndpointController
);

// LIST ALL ENDPOINTS
router.get(
  "/",
  authenticateApiKeyMiddleware,
  listEndpointsController
);

// GET SINGLE ENDPOINT
router.get(
  "/:id",
  authenticateApiKeyMiddleware,
  getEndpointController
);

// UPDATE ENDPOINT
router.patch(
  "/:id",
  authenticateApiKeyMiddleware,
  updateEndpointController
);

// DELETE ENDPOINT
router.delete(
  "/:id",
  authenticateApiKeyMiddleware,
  deleteEndpointController
);

export default router;
