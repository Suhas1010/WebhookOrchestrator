
import { Router } from "express";

import {
  createEventTypeController,
  listEventTypesController,
  publishEventController,
  getEventByIdController,
  listEventsController,
} from "../controllers/event.controller.js";

import { authenticateApiKeyMiddleware } from "../middleware/auth.middleware.js";

const router = Router();

// EVENT TYPE ROUTES
router.post(
  "/event-types",
  authenticateApiKeyMiddleware,
  createEventTypeController
);

router.get(
  "/event-types",
  authenticateApiKeyMiddleware,
  listEventTypesController
);

// EVENT ROUTES
router.post(
  "/events",
  authenticateApiKeyMiddleware,
  publishEventController
);

router.get(
  "/events",
  authenticateApiKeyMiddleware,
  listEventsController
);

router.get(
  "/events/:id",
  authenticateApiKeyMiddleware,
  getEventByIdController
);

export default router;
