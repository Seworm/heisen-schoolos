import fs from "node:fs";
import dotenv from "dotenv";
import { Pool } from "@neondatabase/serverless";

dotenv.config({ path: ".env.local" });

const migrationPath = "drizzle/010_assessments.sql";
const sql = fs.readFileSync(migrationPath, "utf8");

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is missing from .env.local");
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

try {
  console.log("Applying assessment migration...");

  await pool.query(sql);

  console.log("Assessment migration applied successfully.");
} catch (error) {
  console.error("Assessment migration failed:");
  console.error(error);
  process.exitCode = 1;
} finally {
  await pool.end();
}