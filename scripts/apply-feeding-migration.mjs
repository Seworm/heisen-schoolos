import fs from "node:fs";
import dotenv from "dotenv";
import { Pool } from "@neondatabase/serverless";

dotenv.config({ path: ".env.local" });
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is missing from .env.local");

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
try {
  await pool.query(fs.readFileSync("drizzle/0004_daily_feeding_fees.sql", "utf8"));
  console.log("Daily feeding fee migration applied successfully.");
} finally {
  await pool.end();
}
