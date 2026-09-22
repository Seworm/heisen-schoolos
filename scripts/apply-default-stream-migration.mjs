import fs from "node:fs";
import dotenv from "dotenv";
import { Pool } from "@neondatabase/serverless";

dotenv.config({ path: ".env.local" });

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is missing from .env.local");
}

const sql = fs.readFileSync("drizzle/0002_default_stream_a.sql", "utf8");
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

try {
  const result = await pool.query(sql);
  console.log(`Default Stream A migration applied successfully (${result.rowCount ?? 0} rows added).`);
} catch (error) {
  console.error("Default Stream A migration failed:", error);
  process.exitCode = 1;
} finally {
  await pool.end();
}
