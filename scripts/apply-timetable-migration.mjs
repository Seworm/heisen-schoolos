import fs from "node:fs";
import dotenv from "dotenv";
import { Pool } from "@neondatabase/serverless";

dotenv.config({ path: ".env.local" });

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is missing from .env.local");
}

const sql = fs.readFileSync("drizzle/0001_lessons_per_week.sql", "utf8");
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

try {
  await pool.query(sql);
  console.log("Timetable lessons-per-week migration applied successfully.");
} catch (error) {
  console.error("Timetable lessons-per-week migration failed:", error);
  process.exitCode = 1;
} finally {
  await pool.end();
}
