import type { Request, Response, NextFunction } from "express";

export function validateJson(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!req.is("application/json")) {
    res.status(415).json({
      status: "error",
      message: "Content-Type must be application/json",
    });
    return;
  }

  next();
}
