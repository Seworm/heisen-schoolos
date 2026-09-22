import { and, eq } from "drizzle-orm";
import { auth } from "@/../auth";
import { db } from "@/db";
import { schoolMemberships, schools } from "@/db/schema";
import { hasPermission, type Permission } from "@/lib/permissions";

export const PLATFORM_ROLES = [
  "super_admin",
  "platform_admin",
] as const;

export const SCHOOL_ADMIN_ROLES = [
  "platform_admin",
  "super_admin",
  "school_owner",
  "school_admin",
  "principal",
  "headteacher",
] as const;

export const TEACHER_ROLES = [
  "teacher",
  "headteacher",
  "principal",
  "school_admin",
  "school_owner",
  "platform_admin",
  "super_admin",
] as const;

export type SchoolRole = string;

export async function requireAuth() {
  const session = await auth();

  if (!session?.user) {
    throw new Error("Authentication required.");
  }

  return session.user;
}

export function isPlatformRole(role?: string | null) {
  return role === "super_admin" || role === "platform_admin";
}

export function isPlatformUser(user: {
  platformRole?: string | null;
  role?: string | null;
  isPlatformAdmin?: boolean;
  isSuperAdmin?: boolean;
}) {
  return Boolean(
    user.isPlatformAdmin ||
      user.isSuperAdmin ||
      isPlatformRole(user.platformRole) ||
      isPlatformRole(user.role),
  );
}

export async function requireSchoolMembership(schoolId?: string) {
  const user = await requireAuth();

  if (user.accountType === "student") {
    const activeSchoolId = user.schoolId;

    if (
      !activeSchoolId ||
      (schoolId && schoolId !== activeSchoolId)
    ) {
      throw new Error(
        "You are not authorized to access this school.",
      );
    }

    return user;
  }

  /*
   * Platform administrators can operate across schools.
   *
   * Their schoolId is only the default workspace for the
   * existing school-scoped dashboard. Platform authorization
   * itself is not limited to that school.
   */
  if (isPlatformUser(user)) {
    if (schoolId) {
      const [school] = await db
        .select({ id: schools.id })
        .from(schools)
        .where(
          and(
            eq(schools.id, schoolId),
            eq(schools.status, "active"),
          ),
        )
        .limit(1);

      if (!school) {
        throw new Error("The requested school is not available.");
      }

      const [membership] = await db
        .select({
          id: schoolMemberships.id,
          role: schoolMemberships.role,
        })
        .from(schoolMemberships)
        .where(
          and(
            eq(schoolMemberships.userId, user.id),
            eq(schoolMemberships.schoolId, schoolId),
            eq(schoolMemberships.isActive, true),
          ),
        )
        .limit(1);

      /*
       * Platform authority does not require a membership
       * record in every school.
       */
      return {
        ...user,
        membershipId: membership?.id,
        role: user.role,
      };
    }

    return user;
  }

  const activeSchoolId = user.schoolId;

  if (
    !activeSchoolId ||
    (schoolId && schoolId !== activeSchoolId)
  ) {
    throw new Error(
      "You are not authorized to access this school.",
    );
  }

  const [membership] = await db
    .select({
      id: schoolMemberships.id,
      role: schoolMemberships.role,
    })
    .from(schoolMemberships)
    .where(
      and(
        eq(schoolMemberships.userId, user.id),
        eq(schoolMemberships.schoolId, activeSchoolId),
        eq(schoolMemberships.isActive, true),
      ),
    )
    .limit(1);

  if (!membership) {
    throw new Error("Active school membership not found.");
  }

  return {
    ...user,
    membershipId: membership.id,
    role: membership.role,
  };
}

/**
 * Resolve access to a requested school.
 *
 * Platform administrators are intentionally not required to have a
 * membership row in every school. Ordinary staff must still resolve through
 * their active membership, and students remain locked to their own school.
 */
export async function requireSchoolAccess(schoolId: string) {
  if (!schoolId) {
    throw new Error("A school is required.");
  }

  return requireSchoolMembership(schoolId);
}

export async function requireRole(
  roles: readonly string[],
  schoolId?: string,
) {
  const user = await requireSchoolMembership(schoolId);

  if (
    user.accountType === "student" ||
    !user.role ||
    (!isPlatformUser(user) && !roles.includes(user.role))
  ) {
    throw new Error(
      "You do not have permission to perform this action.",
    );
  }

  return user;
}

export async function requirePermission(
  permission: Permission,
  schoolId?: string,
) {
  const user = await requireSchoolMembership(schoolId);

  if (!hasPermission(user, permission)) {
    throw new Error(
      "You do not have permission to perform this action.",
    );
  }

  return user;
}

export async function requireSuperAdmin() {
  const user = await requireAuth();

  if (
    user.accountType === "student" ||
    (!user.isSuperAdmin &&
      user.platformRole !== "super_admin" &&
      user.role !== "super_admin")
  ) {
    throw new Error(
      "Super administrator permission required.",
    );
  }

  return user;
}

export async function requireTeacherScope(
  schoolId?: string,
) {
  return requireRole(TEACHER_ROLES, schoolId);
}