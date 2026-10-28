
import type { Request, Response } from "express";
import { checkDatabase } from "../services/health.service.js";

export async function getDatabaseHealth(
  _req: Request,
  res: Response
): Promise<void> {
  try {
    const database = await checkDatabase();

    res.status(200).json({
      status: "ok",
      database: database?.database,
    });
  } catch (error) {
    console.error("Database health check failed:", error);

    res.status(500).json({
      status: "error",
      message: "Database connection failed",
    });
  }
}
