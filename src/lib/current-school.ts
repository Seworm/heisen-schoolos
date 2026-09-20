import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { schoolMemberships, schools } from "@/db/schema";
import { requireAuth, isPlatformRole } from "@/lib/authorization";

export async function getCurrentSchool() {
  const user = await requireAuth();

  let schoolId = user.schoolId;

  /*
   * Platform owners are allowed to operate across all schools.
   * The existing workspace still needs one school to render, so
   * use the user's primary school as the default.
   */
  if (!schoolId && isPlatformRole(user.role)) {
    const [membership] = await db
      .select({
        schoolId: schoolMemberships.schoolId,
      })
      .from(schoolMemberships)
      .innerJoin(
        schools,
        eq(schools.id, schoolMemberships.schoolId),
      )
      .where(
        and(
          eq(schoolMemberships.userId, user.id),
          eq(schoolMemberships.isActive, true),
          eq(schools.status, "active"),
        ),
      )
      .limit(1);

    schoolId = membership?.schoolId;
  }

  if (!schoolId) {
    throw new Error(
      "No active school is associated with this account.",
    );
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
    .where(
      and(
        eq(schools.id, schoolId),
        eq(schools.status, "active"),
      ),
    )
    .limit(1);

  if (!school) {
    throw new Error(
      "The active school could not be verified.",
    );
  }

  /*
   * Ordinary users must have an active membership in this school.
   * Platform owners are authorized globally and therefore do not
   * require a school membership for every school they administer.
   */
  if (!isPlatformRole(user.role)) {
    const [membership] = await db
      .select({ id: schoolMemberships.id })
      .from(schoolMemberships)
      .where(
        and(
          eq(schoolMemberships.userId, user.id),
          eq(schoolMemberships.schoolId, school.id),
          eq(schoolMemberships.isActive, true),
        ),
      )
      .limit(1);

    if (!membership) {
      throw new Error(
        "Active school membership not found.",
      );
    }
  }

  return school;
}

export async function requireCurrentSchool() {
  return getCurrentSchool();
}