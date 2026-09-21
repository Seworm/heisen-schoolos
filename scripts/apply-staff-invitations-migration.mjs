import fs from "node:fs";
import dotenv from "dotenv";
import { Pool } from "@neondatabase/serverless";

dotenv.config({ path: ".env.local" });

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is missing from .env.local");
}

const sql = fs.readFileSync("drizzle/026_staff_invitations.sql", "utf8");
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

try {
  await pool.query(sql);
  console.log("Staff invitation migration applied successfully.");
} catch (error) {
  console.error("Staff invitation migration failed:", error);
  process.exitCode = 1;
} finally {
  await pool.end();
}
