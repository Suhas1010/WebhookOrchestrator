import { Router } from "express";
import { getDatabaseHealth } from "../controllers/health.controller.js";
import authRouter from "./auth.routes.js";

const router = Router();

router.get("/health/db", getDatabaseHealth);

router.use("/api/v1/auth", authRouter);

export default router;
