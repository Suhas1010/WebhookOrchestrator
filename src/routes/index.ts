import { Router } from "express";
import { getDatabaseHealth } from "../controllers/health.controller.js";
import authRouter from "./auth.routes.js";
import endpointRouter from "./endpoint.routes.js";

const router = Router();

// HEALTH CHECK
router.get("/health/db", getDatabaseHealth);

// AUTHENTICATION ROUTES
router.use("/api/v1/auth", authRouter);

// ENDPOINT MANAGEMENT ROUTES
router.use("/api/v1/endpoints", endpointRouter);

export default router;