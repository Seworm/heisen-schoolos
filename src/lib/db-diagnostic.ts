import { sql } from "drizzle-orm";
import { db } from "@/db";

export async function getDbDiagnostic() {
  const result = await db.execute(sql`
    SELECT
      current_database() AS database_name,
      current_schema() AS schema_name,
      current_user AS database_user,
      current_setting('server_version') AS postgres_version
  `);

  return result.rows[0];
}