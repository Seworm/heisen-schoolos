import { eq } from "drizzle-orm";
import { db } from "@/db";
import { schools } from "@/db/schema";

const DEV_SCHOOL_SLUG = "heisen-demo-school";

export async function getCurrentSchool() {
  const [school] = await db
    .select()
    .from(schools)
    .where(eq(schools.slug, DEV_SCHOOL_SLUG))
    .limit(1);

  if (!school) {
    throw new Error(
      `Development school "${DEV_SCHOOL_SLUG}" was not found.`,
    );
  }

  return school;
}

export async function requireCurrentSchool() {
  return getCurrentSchool();
}