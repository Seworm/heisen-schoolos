import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { schoolMemberships, schools } from "@/db/schema";
import { requireAuth } from "@/lib/authorization";

/**
 * Resolves the active school exclusively from the authenticated user's
 * active school membership. A client-supplied school ID is never trusted.
 */
export async function getCurrentSchool() {
  const user = await requireAuth();

  if (!user.schoolId) {
    throw new Error("No active school is associated with this account.");
  }

  const [school] = await db
    .select({
      id: schools.id,
      name: schools.name,
      slug: schools.slug,
      schoolCode: schools.schoolCode,
      schoolType: schools.schoolType,
      status: schools.status,
      region: schools.region,
      district: schools.district,
      town: schools.town,
      address: schools.address,
      phone: schools.phone,
      email: schools.email,
      website: schools.website,
      logoUrl: schools.logoUrl,
    })
    .from(schools)
    .innerJoin(
      schoolMemberships,
      eq(schoolMemberships.schoolId, schools.id),
    )
    .where(
      and(
        eq(schools.id, user.schoolId),
        eq(schoolMemberships.userId, user.id),
        eq(schoolMemberships.isActive, true),
      ),
    )
    .limit(1);

  if (!school || school.status !== "active") {
    throw new Error("The active school could not be verified.");
  }

  return school;
}

export async function requireCurrentSchool() {
  return getCurrentSchool();
}
