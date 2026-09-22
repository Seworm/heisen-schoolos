import { and, eq, ne } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { schoolMemberships, schools } from "@/db/schema";
import { requireAuth, isPlatformUser } from "@/lib/authorization";

const ACTIVE_SCHOOL_COOKIE = "heisensms_active_school_id";
const LEGACY_ACTIVE_SCHOOL_COOKIE = "schoolos_active_school_id";

export const ACTIVE_SCHOOL_COOKIE_NAME = ACTIVE_SCHOOL_COOKIE;

export async function resolveSchoolContext() {
  const user = await requireAuth();
  const school = await getCurrentSchool();
  return { user, school };
}

export async function getCurrentSchool() {
  const user = await requireAuth();

  let schoolId: string | null = user.schoolId ?? null;

  if (isPlatformUser(user)) {
    const cookieStore = await cookies();
    const activeSchoolId =
      cookieStore.get(ACTIVE_SCHOOL_COOKIE)?.value ??
      cookieStore.get(LEGACY_ACTIVE_SCHOOL_COOKIE)?.value;

    schoolId = activeSchoolId ?? null;
  }

  if (!schoolId) {
    if (isPlatformUser(user)) {
      redirect("/dashboard");
    }

    throw new Error("Select a school before opening the school workspace.");
  }

  const [school] = await db
    .select({
      id: schools.id,
      name: schools.name,
      slug: schools.slug,
      schoolCode: schools.schoolCode,
      logoUrl: schools.logoUrl,
      status: schools.status,
      schoolType: schools.schoolType,
      region: schools.region,
      district: schools.district,
      town: schools.town,
      address: schools.address,
      phone: schools.phone,
      email: schools.email,
      website: schools.website,
    })
    .from(schools)
    .where(
      and(
        eq(schools.id, schoolId),
        isPlatformUser(user)
          ? ne(schools.status, "deactivated")
          : eq(schools.status, "active"),
      ),
    )
    .limit(1);

  if (!school) {
    if (isPlatformUser(user)) {
      redirect("/dashboard");
    }

    throw new Error("The active school could not be verified.");
  }

  if (!isPlatformUser(user)) {
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
      throw new Error("Active school membership not found.");
    }
  }

  return school;
}

export async function requireCurrentSchool() {
  return getCurrentSchool();
}
