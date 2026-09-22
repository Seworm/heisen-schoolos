import dotenv from "dotenv";
import postgres from "postgres";

dotenv.config({ path: ".env.local" });

const preserveEmail = "atsu.seworm@gmail.com";
const confirmation = process.env.RESET_FOR_DEPLOYMENT_CONFIRMATION;

if (confirmation !== "RESET_HEISEN_SCHOOLOS") {
  throw new Error(
    "Refusing to reset the database. Set RESET_FOR_DEPLOYMENT_CONFIRMATION=RESET_HEISEN_SCHOOLOS to continue.",
  );
}

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is missing from .env.local.");
}

const sql = postgres(process.env.DATABASE_URL, { max: 1 });

try {
  await sql.begin(async (transaction) => {
    const tables = await transaction.unsafe(`
      SELECT tablename
      FROM pg_catalog.pg_tables
      WHERE schemaname = 'public'
        AND tablename NOT IN ('users', '__drizzle_migrations')
      ORDER BY tablename
    `);

    if (tables.length > 0) {
      const qualifiedTables = tables
        .map(({ tablename }) => `"public"."${tablename.replaceAll('"', '""')}"`)
        .join(", ");
      await transaction.unsafe(`TRUNCATE TABLE ${qualifiedTables} RESTART IDENTITY CASCADE`);
    }

    await transaction.unsafe(
      "DELETE FROM public.users WHERE lower(email) <> lower($1)",
      [preserveEmail],
    );

    const [remaining] = await transaction.unsafe(
      "SELECT email, platform_role, status FROM public.users",
    );

    if (
      !remaining ||
      remaining.email.toLowerCase() !== preserveEmail ||
      remaining.platform_role !== "super_admin" ||
      remaining.status !== "active"
    ) {
      throw new Error("Reset verification failed: the active super-admin account was not preserved.");
    }
  });

  console.log(`Deployment reset complete. Preserved active super-admin: ${preserveEmail}`);
} finally {
  await sql.end();
}
