import argon2 from "argon2";
import pool from "../db/pool.js";
import { ApiError } from "../utils/api-error.js";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { createHash, randomBytes } from "node:crypto";

interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

// ─────────────────────────────────────────────
// REGISTER TENANT
// ─────────────────────────────────────────────

export async function registerTenant(input: RegisterInput) {
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();

  const passwordHash = await argon2.hash(input.password);

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const tenantResult = await client.query(
      `INSERT INTO tenants (name)
       VALUES ($1)
       RETURNING id, name, created_at`,
      [name]
    );

    const tenant = tenantResult.rows[0];

    if (!tenant) {
      throw new Error("Failed to create tenant");
    }

    await client.query(
      `INSERT INTO users (tenant_id, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id`,
      [tenant.id, email, passwordHash]
    );

    await client.query("COMMIT");

    return {
      tenantId: String(tenant.id),
      name: tenant.name,
      email,
      createdAt: tenant.created_at,
    };
  } catch (error: unknown) {
    await client.query("ROLLBACK").catch(() => {});

    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "23505"
    ) {
      throw new ApiError(409, "Email is already registered");
    }

    throw error;
  } finally {
    client.release();
  }
}

// ─────────────────────────────────────────────
// LOGIN USER
// ─────────────────────────────────────────────

export async function loginUser(
  email: string,
  password: string
) {
  const normalizedEmail = email.trim().toLowerCase();

  const result = await pool.query(
    `SELECT id, tenant_id, email, password_hash, role
     FROM users
     WHERE email = $1`,
    [normalizedEmail]
  );

  const user = result.rows[0];

  if (!user) {
    throw new ApiError(401, "Invalid email or password");
  }

  const passwordMatches = await argon2.verify(
    user.password_hash,
    password
  );

  if (!passwordMatches) {
    throw new ApiError(401, "Invalid email or password");
  }

  const token = jwt.sign(
    {
      sub: String(user.id),
      tenantId: String(user.tenant_id),
      role: user.role,
    },
    env.JWT_SECRET,
    { expiresIn: "1h" }
  );

  return {
    userId: String(user.id),
    tenantId: String(user.tenant_id),
    email: user.email,
    role: user.role,
    token,
  };
}

// ─────────────────────────────────────────────
// CREATE API KEY
// ─────────────────────────────────────────────

export async function createApiKey(tenantId: string) {
  // Generate a cryptographically secure API key
  const key = `whk_${randomBytes(32).toString("hex")}`;

  // Store only its SHA-256 hash in the database
  const keyHash = createHash("sha256")
    .update(key)
    .digest("hex");

  // Store a short prefix for identification
  const keyPrefix = key.slice(0, 12);

  const result = await pool.query(
    `INSERT INTO api_keys (tenant_id, key_prefix, key_hash)
     VALUES ($1, $2, $3)
     RETURNING id, key_prefix, created_at`,
    [tenantId, keyPrefix, keyHash]
  );

  // Return the actual key only once
  return {
    ...result.rows[0],
    key,
  };
}

// ─────────────────────────────────────────────
// LIST API KEYS
// ─────────────────────────────────────────────

export async function listApiKeys(tenantId: string) {
  const result = await pool.query(
    `SELECT id, key_prefix, created_at, revoked_at, last_used_at
     FROM api_keys
     WHERE tenant_id = $1
     ORDER BY created_at DESC`,
    [tenantId]
  );

  return result.rows;
}

// ─────────────────────────────────────────────
// REVOKE API KEY
// ─────────────────────────────────────────────

export async function revokeApiKey(
  tenantId: string,
  keyId: string
) {
  const result = await pool.query(
    `UPDATE api_keys
     SET revoked_at = NOW()
     WHERE id = $1
       AND tenant_id = $2
       AND revoked_at IS NULL
     RETURNING id`,
    [keyId, tenantId]
  );

  if (result.rows.length === 0) {
    throw new ApiError(404, "API key not found");
  }
}

// ─────────────────────────────────────────────
// AUTHENTICATE API KEY
// ─────────────────────────────────────────────

export async function authenticateApiKey(key: string) {
  // Basic format validation
  if (!key || !/^whk_[a-f0-9]{64}$/.test(key)) {
    throw new ApiError(401, "Invalid API key");
  }

  const keyHash = createHash("sha256")
    .update(key)
    .digest("hex");

  // Verify the key and update its last-used timestamp
  const result = await pool.query(
    `UPDATE api_keys
     SET last_used_at = NOW()
     WHERE key_hash = $1
       AND revoked_at IS NULL
     RETURNING id, tenant_id`,
    [keyHash]
  );

  const apiKey = result.rows[0];

  if (!apiKey) {
    throw new ApiError(401, "Invalid API key");
  }

  return {
    apiKeyId: String(apiKey.id),
    tenantId: String(apiKey.tenant_id),
  };
}
