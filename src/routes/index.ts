
import { Router } from "express";
import { getDatabaseHealth } from "../controllers/health.controller.js";

const router = Router();

router.get("/health/db", getDatabaseHealth);

export default router;
