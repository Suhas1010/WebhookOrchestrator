
import type { Request, Response } from "express";

import {
  createEventType,
  listEventTypes,
  publishEvent,
  getEventById,
  listEvents,
} from "../services/event.service.js";

import { ApiError } from "../utils/api-error.js";

// CREATE EVENT TYPE
export async function createEventTypeController(
  req: Request,
  res: Response
) {
  const tenantId = req.auth?.tenantId;
  const { name } = req.body;

  if (!tenantId) {
    throw new ApiError(401, "Authentication required");
  }

  if (typeof name !== "string" || !name.trim()) {
    throw new ApiError(400, "Event type name is required");
  }

  const eventType = await createEventType(tenantId, name);

  return res.status(201).json({
    success: true,
    message: "Event type created successfully",
    data: eventType,
  });
}

// LIST EVENT TYPES
export async function listEventTypesController(
  req: Request,
  res: Response
) {
  const tenantId = req.auth?.tenantId;

  if (!tenantId) {
    throw new ApiError(401, "Authentication required");
  }

  const eventTypes = await listEventTypes(tenantId);

  return res.status(200).json({
    success: true,
    data: eventTypes,
  });
}

// PUBLISH EVENT
export async function publishEventController(
  req: Request,
  res: Response
) {
  const tenantId = req.auth?.tenantId;

  const { eventTypeId, payload, idempotencyKey } = req.body;

  if (!tenantId) {
    throw new ApiError(401, "Authentication required");
  }

  if (typeof eventTypeId !== "string" || !eventTypeId.trim()) {
    throw new ApiError(400, "Valid eventTypeId is required");
  }

  if (
    typeof payload !== "object" ||
    payload === null ||
    Array.isArray(payload)
  ) {
    throw new ApiError(400, "Payload must be a valid JSON object");
  }

  if (
    idempotencyKey !== undefined &&
    (typeof idempotencyKey !== "string" || !idempotencyKey.trim())
  ) {
    throw new ApiError(400, "Invalid idempotency key");
  }

  const event = await publishEvent(tenantId, {
    eventTypeId: eventTypeId.trim(),
    payload,
    ...(idempotencyKey !== undefined
      ? { idempotencyKey: idempotencyKey.trim() }
      : {}),
  });

  return res.status(201).json({
    success: true,
    message: "Event published successfully",
    data: event,
  });
}

// GET EVENT BY ID
export async function getEventByIdController(
  req: Request,
  res: Response
) {
  const tenantId = req.auth?.tenantId;
  const eventId = req.params.id;

  if (!tenantId) {
    throw new ApiError(401, "Authentication required");
  }

  if (typeof eventId !== "string" || !eventId.trim()) {
    throw new ApiError(400, "Valid event ID is required");
  }

  const event = await getEventById(tenantId, eventId);

  return res.status(200).json({
    success: true,
    data: event,
  });
}

// LIST EVENTS WITH PAGINATION
export async function listEventsController(
  req: Request,
  res: Response
) {
  const tenantId = req.auth?.tenantId;

  if (!tenantId) {
    throw new ApiError(401, "Authentication required");
  }

  const pageParam = req.query.page;
  const limitParam = req.query.limit;

  const page =
    typeof pageParam === "string" ? Number(pageParam) : 1;

  const limit =
    typeof limitParam === "string" ? Number(limitParam) : 10;

  if (
    !Number.isInteger(page) ||
    !Number.isInteger(limit) ||
    page < 1 ||
    limit < 1 ||
    limit > 100
  ) {
    throw new ApiError(400, "Invalid pagination parameters");
  }

  const events = await listEvents(tenantId, page, limit);

  return res.status(200).json({
    success: true,
    page,
    limit,
    count: events.length,
    data: events,
  });
}
