import type { ErrorRequestHandler } from "express";
import { ApiError } from "../utils/api-error.js";

export const errorHandler: ErrorRequestHandler = (
  err,
  _req,
  res,
  next
) => {
  console.error("Request failed:", err);

  if (res.headersSent) {
    return next(err);
  }

  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      status: "error",
      message: err.message,
    });
    return;
  }

  res.status(500).json({
    status: "error",
    message: "Internal server error",
  });
};
