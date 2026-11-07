
import pool from "../db/pool.js";
import { ApiError } from "../utils/api-error.js";

// TYPES

interface PublishEventInput {
  eventTypeId: string;
  payload: Record<string, unknown>;
  idempotencyKey?: string;
}

// CHECK POSTGRES UNIQUE CONSTRAINT ERROR

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "23505"
  );
}

// CREATE EVENT TYPE

export async function createEventType(
  tenantId: string,
  name: string
) {
  const normalizedName = name.trim().toLowerCase();

  if (!normalizedName) {
    throw new ApiError(400, "Event type name is required");
  }

  try {
    const result = await pool.query(
      `INSERT INTO event_types (tenant_id, name)
       VALUES ($1, $2)
       RETURNING id, tenant_id, name, created_at`,
      [tenantId, normalizedName]
    );

    return result.rows[0];

  } catch (error: unknown) {
    if (isUniqueViolation(error)) {
      throw new ApiError(409, "Event type already exists");
    }

    throw error;
  }
}

// LIST EVENT TYPES

export async function listEventTypes(tenantId: string) {
  const result = await pool.query(
    `SELECT id, name, created_at
     FROM event_types
     WHERE tenant_id = $1
     ORDER BY created_at DESC`,
    [tenantId]
  );

  return result.rows;
}

// PUBLISH EVENT

export async function publishEvent(
  tenantId: string,
  input: PublishEventInput
) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // i. Verify that the event type belongs to this tenant.

    const eventTypeResult = await client.query(
      `SELECT id
       FROM event_types
       WHERE id = $1 AND tenant_id = $2`,
      [input.eventTypeId, tenantId]
    );

    if (eventTypeResult.rows.length === 0) {
      throw new ApiError(404, "Event type not found");
    }

    // ii. Find enabled endpoints subscribed to this event type.

    const endpointsResult = await client.query(
      `SELECT es.endpoint_id
       FROM endpoint_subscriptions es
       JOIN endpoints e
         ON e.id = es.endpoint_id
        AND e.tenant_id = es.tenant_id
       WHERE es.tenant_id = $1
         AND es.event_type_id = $2
         AND e.enabled = TRUE
         AND e.deleted_at IS NULL`,
      [tenantId, input.eventTypeId]
    );

    // iii. Insert the event.

    const eventResult = await client.query(
      `INSERT INTO events (
         tenant_id,
         event_type_id,
         payload,
         idempotency_key
       )
       VALUES ($1, $2, $3, $4)
       RETURNING
         id,
         tenant_id,
         event_type_id,
         payload,
         idempotency_key,
         created_at`,
      [
        tenantId,
        input.eventTypeId,
        JSON.stringify(input.payload),
        input.idempotencyKey ?? null,
      ]
    );

    const event = eventResult.rows[0];

    // iv. Create one pending delivery for every subscribed endpoint.

    for (const endpoint of endpointsResult.rows) {
      await client.query(
        `INSERT INTO deliveries (
           event_id,
           tenant_id,
           endpoint_id,
           status,
           attempt_count,
           next_attempt_at
         )
         VALUES ($1, $2, $3, 'pending', 0, NOW())`,
        [event.id, tenantId, endpoint.endpoint_id]
      );
    }

    // v. Commit the transaction.

    await client.query("COMMIT");

    return {
      ...event,
      deliveryCount: endpointsResult.rows.length,
    };

  } catch (error: unknown) {

    // Roll back all changes if something fails.
    // Do not allow a rollback error to hide the original error.

    try {
      await client.query("ROLLBACK");
    } catch {
      // Preserve the original transaction error.
    }

    if (isUniqueViolation(error)) {
      throw new ApiError(
        409,
        "Duplicate event: idempotency key already used"
      );
    }

    throw error;

  } finally {
    // Return the connection to the pool.

    client.release();
  }
}

// GET EVENT BY ID

export async function getEventById(
  tenantId: string,
  eventId: string
) {
  const result = await pool.query(
    `SELECT
       e.id,
       e.tenant_id,
       e.event_type_id,
       et.name AS event_type,
       e.payload,
       e.idempotency_key,
       e.created_at
     FROM events e
     JOIN event_types et
       ON et.id = e.event_type_id
      AND et.tenant_id = e.tenant_id
     WHERE e.id = $1
       AND e.tenant_id = $2`,
    [eventId, tenantId]
  );

  const event = result.rows[0];

  if (!event) {
    throw new ApiError(404, "Event not found");
  }

  return event;
}

// LIST EVENTS WITH PAGINATION

export async function listEvents(
  tenantId: string,
  page: number,
  limit: number
) {
  if (
    !Number.isInteger(page) ||
    !Number.isInteger(limit) ||
    page < 1 ||
    limit < 1 ||
    limit > 100
  ) {
    throw new ApiError(400, "Invalid pagination parameters");
  }

  const offset = (page - 1) * limit;

  const result = await pool.query(
    `SELECT
       e.id,
       e.event_type_id,
       et.name AS event_type,
       e.payload,
       e.idempotency_key,
       e.created_at
     FROM events e
     JOIN event_types et
       ON et.id = e.event_type_id
      AND et.tenant_id = e.tenant_id
     WHERE e.tenant_id = $1
     ORDER BY e.created_at DESC
     LIMIT $2 OFFSET $3`,
    [tenantId, limit, offset]
  );

  return result.rows;
}
