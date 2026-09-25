import { and, eq, ne, or } from "drizzle-orm";
import { auth } from "@/../auth";
import { db } from "@/db";
import {
  schoolMemberships,
  schools,
  staff,
  teacherAssignments,
} from "@/db/schema";
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

export function isSchoolAdminRole(role?: string | null) {
  return Boolean(
    role &&
      (SCHOOL_ADMIN_ROLES as readonly string[]).includes(role),
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

    const [school] = await db
      .select({ status: schools.status })
      .from(schools)
      .where(eq(schools.id, activeSchoolId))
      .limit(1);

    if (!school || school.status !== "active") {
      throw new Error(
        school?.status === "suspended"
          ? "This school is suspended because its subscription was not renewed. Contact the platform administrator."
          : "This school is not currently available.",
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
            ne(schools.status, "deactivated"),
          ),
        )
        .limit(1);

      if (!school) {
        throw new Error(
          "The requested school is not available.",
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

  const [school] = await db
    .select({
      id: schools.id,
      status: schools.status,
    })
    .from(schools)
    .where(eq(schools.id, activeSchoolId))
    .limit(1);

  if (!school || school.status !== "active") {
    throw new Error(
      school?.status === "suspended"
        ? "This school is suspended because its subscription was not renewed. Contact the platform administrator."
        : "This school is not currently available.",
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

/**
 * Verifies that the current user is:
 * - a platform administrator,
 * - a school administrator, or
 * - an active teacher linked to a staff record.
 *
 * This function establishes teacher identity.
 * Resource-level authorization is handled by the
 * teacher stream/subject access helpers below.
 */
export async function requireTeacherScope(
  schoolId?: string,
) {
  const user = await requireRole(TEACHER_ROLES, schoolId);

  // Platform and school administrators have unrestricted school-wide access.
  if (
    isPlatformUser(user) ||
    (user.role && isSchoolAdminRole(user.role))
  ) {
    return user;
  }

  if (user.role !== "teacher") {
    throw new Error("Teacher permission required.");
  }

  if (!user.email || !user.schoolId) {
    throw new Error(
      "Teacher account is not linked to a school staff record.",
    );
  }

  const [teacher] = await db
    .select({
      id: staff.id,
      email: staff.email,
    })
    .from(staff)
    .where(
      and(
        eq(staff.schoolId, user.schoolId),
        eq(staff.email, user.email),
        eq(staff.status, "active"),
      ),
    )
    .limit(1);

  if (!teacher) {
    throw new Error("Teacher staff record not found.");
  }

  return {
    ...user,
    staffId: teacher.id,
  };
}

/**
 * Whole-stream access.
 *
 * Ordinary teachers must be explicitly assigned as the class teacher
 * for the requested stream and academic year.
 *
 * Platform and school administrators remain unrestricted.
 */
export async function requireTeacherStreamAccess(
  streamId: string,
  academicYearId: string,
  schoolId?: string,
) {
  const user = await requireTeacherScope(schoolId);

  if (
    isPlatformUser(user) ||
    (user.role && isSchoolAdminRole(user.role))
  ) {
    return user;
  }

  const [assignment] = await db
    .select({
      id: teacherAssignments.id,
    })
    .from(teacherAssignments)
    .where(
      and(
        eq(
          teacherAssignments.staffId,
          (user as typeof user & { staffId: string }).staffId,
        ),
        eq(teacherAssignments.streamId, streamId),
        eq(teacherAssignments.academicYearId, academicYearId),
        eq(teacherAssignments.isClassTeacher, true),
      ),
    )
    .limit(1);

  if (!assignment) {
    throw new Error(
      "You are not the class teacher for this class or stream.",
    );
  }

  return user;
}

/**
 * Subject-level access.
 *
 * A subject teacher must have an explicit assignment for the
 * requested subject, stream, and academic year.
 *
 * A class teacher has whole-stream authority, so their
 * class-teacher assignment also grants access to subjects
 * within that stream for the same academic year.
 *
 * Platform and school administrators remain unrestricted.
 */
export async function requireTeacherSubjectAccess(
  streamId: string,
  subjectId: string,
  academicYearId: string,
  schoolId?: string,
) {
  const user = await requireTeacherScope(schoolId);

  if (
    isPlatformUser(user) ||
    (user.role && isSchoolAdminRole(user.role))
  ) {
    return user;
  }

  const [assignment] = await db
    .select({
      id: teacherAssignments.id,
    })
    .from(teacherAssignments)
    .where(
      and(
        eq(
          teacherAssignments.staffId,
          (user as typeof user & { staffId: string }).staffId,
        ),
        eq(teacherAssignments.streamId, streamId),
        eq(teacherAssignments.academicYearId, academicYearId),
        or(
          eq(teacherAssignments.subjectId, subjectId),
          eq(teacherAssignments.isClassTeacher, true),
        ),
      ),
    )
    .limit(1);

  if (!assignment) {
    throw new Error(
      "You are not assigned to this subject in this class or stream.",
    );
  }

  return user;
}
