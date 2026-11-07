import pool from "../db/pool.js";
import { ApiError } from "../utils/api-error.js";
import { randomBytes } from "node:crypto";

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────

interface CreateEndpointInput {
  url: string;
  description?: string;
}

interface UpdateEndpointInput {
  url?: string;
  description?: string | null;
  enabled?: boolean;
}

// ─────────────────────────────────────────────
// CREATE ENDPOINT
// ─────────────────────────────────────────────

export async function createEndpoint(
  tenantId: string,
  input: CreateEndpointInput
) {
  // Generate a cryptographically secure endpoint secret
  const secret = randomBytes(32).toString("hex");

  const result = await pool.query(
    `INSERT INTO endpoints (
       tenant_id,
       url,
       description,
       secret
     )
     VALUES ($1, $2, $3, $4)
     RETURNING
       id,
       tenant_id,
       url,
       description,
       enabled,
       created_at`,
    [
      tenantId,
      input.url,
      input.description?.trim() || null,
      secret,
    ]
  );

  return {
    ...result.rows[0],
    secret,
  };
}

// ─────────────────────────────────────────────
// LIST ENDPOINTS
// ─────────────────────────────────────────────

export async function listEndpoints(tenantId: string) {
  const result = await pool.query(
    `SELECT
       id,
       url,
       description,
       enabled,
       disabled_reason,
       consecutive_failures,
       created_at
     FROM endpoints
     WHERE tenant_id = $1
       AND deleted_at IS NULL
     ORDER BY created_at DESC`,
    [tenantId]
  );

  return result.rows;
}

// ─────────────────────────────────────────────
// GET ENDPOINT BY ID
// ─────────────────────────────────────────────

export async function getEndpoint(
  tenantId: string,
  endpointId: string
) {
  const result = await pool.query(
    `SELECT
       id,
       url,
       description,
       enabled,
       disabled_reason,
       consecutive_failures,
       created_at
     FROM endpoints
     WHERE id = $1
       AND tenant_id = $2
       AND deleted_at IS NULL`,
    [endpointId, tenantId]
  );

  const endpoint = result.rows[0];

  if (!endpoint) {
    throw new ApiError(404, "Endpoint not found");
  }

  return endpoint;
}

// ─────────────────────────────────────────────
// UPDATE ENDPOINT
// ─────────────────────────────────────────────

export async function updateEndpoint(
  tenantId: string,
  endpointId: string,
  input: UpdateEndpointInput
) {
  if (
    input.url === undefined &&
    input.description === undefined &&
    input.enabled === undefined
  ) {
    throw new ApiError(400, "No fields provided for update");
  }

  const result = await pool.query(
    `UPDATE endpoints
     SET
       url = COALESCE($3, url),

       description = CASE
         WHEN $4 THEN $5
         ELSE description
       END,

       enabled = COALESCE($6::boolean, enabled),

       disabled_reason = CASE
         WHEN $6::boolean IS TRUE THEN NULL
         WHEN $6::boolean IS FALSE THEN 'Manually disabled'
         ELSE disabled_reason
       END

     WHERE id = $1
       AND tenant_id = $2
       AND deleted_at IS NULL

     RETURNING
       id,
       url,
       description,
       enabled,
       disabled_reason,
       consecutive_failures,
       created_at`,
    [
      endpointId, //$1
      tenantId, //$2
      input.url ?? null, //$3
      input.description !== undefined, //$4
      input.description ?? null, //$5
      input.enabled ?? null, //$6
    ]
  );

  const endpoint = result.rows[0];

  if (!endpoint) {
    throw new ApiError(404, "Endpoint not found");
  }

  return endpoint;
}

// ─────────────────────────────────────────────
// DELETE ENDPOINT (SOFT DELETE)
// ─────────────────────────────────────────────

export async function deleteEndpoint(
  tenantId: string,
  endpointId: string
) {
  const result = await pool.query(
    `UPDATE endpoints
     SET
       deleted_at = NOW(),
       enabled = FALSE,
       disabled_reason = 'Endpoint deleted'
     WHERE id = $1
       AND tenant_id = $2
       AND deleted_at IS NULL
     RETURNING id`,
    [endpointId, tenantId]
  );

  if (result.rows.length === 0) {
    throw new ApiError(404, "Endpoint not found");
  }
}