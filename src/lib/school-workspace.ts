"use server";

import { and, eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { schools } from "@/db/schema";
import { requireRole } from "@/lib/authorization";
import { ACTIVE_SCHOOL_COOKIE_NAME } from "@/lib/current-school";

export async function getAvailableSchools() {
  await requireRole(["super_admin", "platform_admin"]);

  return db
    .select({
      id: schools.id,
      name: schools.name,
      slug: schools.slug,
      status: schools.status,
    })
    .from(schools)
    .where(eq(schools.status, "active"))
    .orderBy(schools.name);
}

export async function switchActiveSchool(schoolId: string) {
  await requireRole(["super_admin", "platform_admin"]);

  const [school] = await db
    .select({ id: schools.id })
    .from(schools)
    .where(and(eq(schools.id, schoolId), eq(schools.status, "active")))
    .limit(1);

  if (!school) {
    throw new Error("The selected school is not available.");
  }

  (await cookies()).set(ACTIVE_SCHOOL_COOKIE_NAME, school.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  revalidatePath("/", "layout");
  return { success: true };
}
