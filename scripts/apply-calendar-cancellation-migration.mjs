import "dotenv/config";
import { readFile } from "node:fs/promises";
import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL, { max: 1 });
const migration = await readFile(new URL("../drizzle/0010_calendar_event_cancellation.sql", import.meta.url), "utf8");
await sql.unsafe(migration);
await sql.end();
console.log("Calendar cancellation migration applied.");
