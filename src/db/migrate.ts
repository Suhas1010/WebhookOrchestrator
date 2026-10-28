
import { readFile, readdir } from "node:fs/promises";
import pool from "./pool.js";

async function runMigrations(): Promise<void> {
  let client;

  try {
    client = await pool.connect();

    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version VARCHAR(255) PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    console.log("Migration tracking table is ready");

    const files = await readdir("migrations");

    const migrationFiles = files
      .filter((file) => file.endsWith(".sql"))
      .sort();

    for (const file of migrationFiles) {
      const result = await client.query(
        "SELECT version FROM schema_migrations WHERE version = $1",
        [file]
      );

      if (result.rows.length > 0) {
        console.log(`Skipping ${file}; already applied`);
        continue;
      }

      const sql = await readFile(`migrations/${file}`, "utf8");

      try {
        await client.query("BEGIN");

        await client.query(sql);

        await client.query(
          "INSERT INTO schema_migrations (version) VALUES ($1)",
          [file]
        );

        await client.query("COMMIT");

        console.log(`Applied migration: ${file}`);
      } catch (error) {
        try {
          await client.query("ROLLBACK");
        } catch (rollbackError) {
          console.error("Rollback failed:", rollbackError);
        }

        throw error;
      }
    }

    console.log("Migrations completed");
  } finally {
    client?.release();
    await pool.end();
  }
}

runMigrations().catch((error: unknown) => {
  console.error("Migration failed:", error);
  process.exitCode = 1;
});
