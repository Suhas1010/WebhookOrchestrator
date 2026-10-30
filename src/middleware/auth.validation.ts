import type { Request, Response, NextFunction } from "express";

export function validateRegistrationBody(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const { name, email, password } = req.body ?? {};

  if (
    typeof name !== "string" ||
    typeof email !== "string" ||
    typeof password !== "string"
  ) {
    res.status(400).json({
      status: "error",
      message: "Name, email, and password are required",
    });
    return;
  }

  if (name.trim().length === 0 || name.trim().length > 100) {
    res.status(400).json({
      status: "error",
      message: "Name must contain 1–100 characters",
    });
    return;
  }

  const normalizedEmail = email.trim();

  if (
    normalizedEmail.length === 0 ||
    normalizedEmail.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)
  ) {
    res.status(400).json({
      status: "error",
      message: "A valid email address is required",
    });
    return;
  }

  if (password.length < 12 || password.length > 128) {
    res.status(400).json({
      status: "error",
      message: "Password must contain 12–128 characters",
    });
    return;
  }

  next();
}
export function validateLoginBody(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const { email, password } = req.body ?? {};

  if (
    typeof email !== "string" ||
    typeof password !== "string"
  ) {
    res.status(400).json({
      status: "error",
      message: "Email and password are required",
    });
    return;
  }

  if (
    email.trim().length === 0 ||
    email.trim().length > 254 ||
    password.length === 0 ||
    password.length > 128
  ) {
    res.status(400).json({
      status: "error",
      message: "Invalid login input",
    });
    return;
  }

  next();
}