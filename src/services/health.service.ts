
import pool from "../db/pool.js";

export async function checkDatabase() {
  const result = await pool.query(
    "SELECT current_database() AS database"
  );

  return result.rows[0];
}
