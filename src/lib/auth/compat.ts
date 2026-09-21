"use server";

import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  guardianUserAccounts,
  guardians,
  schoolMemberships,
  schools,
  studentGuardians,
  studentUserAccounts,
  students,
  users,
} from "@/db/schema";
import { getNeonAuth } from "@/lib/auth/server";

const PLATFORM_ROLES = ["super_admin", "platform_admin"] as const;

export type ApplicationUser = {
  id: string;
  authUserId?: string;
  email: string;
  name: string;
  firstName: string;
  lastName: string;
  accountType: "staff" | "student" | "guardian";

  schoolId?: string;
  schoolName?: string;
  membershipId?: string;

  role?: string;
  platformRole?: "platform_admin" | "super_admin";

  isPlatformAdmin?: boolean;
  isSuperAdmin?: boolean;

  schoolMemberships?: Array<{
    membershipId: string;
    schoolId: string;
    schoolName: string;
    role: string;
  }>;

  studentNumber?: string;

  guardianId?: string;

  children?: Array<{
    id: string;
    studentNumber: string;
    firstName: string;
    lastName: string;
    schoolId: string;
  }>;

  mustChangePassword?: boolean;
};

export async function getApplicationSession() {
  const { data } = await getNeonAuth().getSession();
  const authUser = data?.user;

  if (!authUser?.email) {
    return null;
  }

  const email = authUser.email.trim().toLowerCase();

  /*
   * STAFF / PLATFORM USER
   */
  const [applicationUser] = await db
    .select({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      platformRole: users.platformRole,
      status: users.status,
    })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (applicationUser) {
    if (applicationUser.status !== "active") {
      return null;
    }

    /*
     * School memberships are now independent from platform roles.
     *
     * A platform administrator can therefore exist without
     * belonging to any school.
     */
    const memberships = await db
      .select({
        membershipId: schoolMemberships.id,
        schoolId: schools.id,
        schoolName: schools.name,
        role: schoolMemberships.role,
      })
      .from(schoolMemberships)
      .innerJoin(
        schools,
        eq(schools.id, schoolMemberships.schoolId),
      )
      .where(
        and(
          eq(schoolMemberships.userId, applicationUser.id),
          eq(schoolMemberships.isActive, true),
          eq(schools.status, "active"),
        ),
      );

    /*
     * Legacy compatibility:
     *
     * Existing school memberships may still contain platform_admin
     * or super_admin. We recognize them temporarily, but the
     * authoritative platform role is now users.platformRole.
     */
    const platformMembership = memberships.find((membership) =>
      PLATFORM_ROLES.includes(
        membership.role as (typeof PLATFORM_ROLES)[number],
      ),
    );

    /*
     * Platform role comes from users.platform_role.
     *
     * Do NOT derive the owner's platform identity from a school
     * membership or configured email.
     */
    const platformRole = applicationUser.platformRole;

    const isPlatformAdmin =
      platformRole === "platform_admin" ||
      platformRole === "super_admin";

    const isSuperAdmin =
      platformRole === "super_admin";

    /*
     * Ordinary staff must belong to at least one active school.
     *
     * Platform users do not need a school membership.
     */
    if (memberships.length === 0 && !isPlatformAdmin) {
      return null;
    }

    /*
     * The first school membership is the user's normal school
     * context when they actually belong to a school.
     *
     * Platform-only users will have no membership, so all these
     * values remain undefined.
     */
    const primaryMembership = memberships[0];

    return {
      user: {
        id: applicationUser.id,
        authUserId: authUser.id,
        email,

        name: `${applicationUser.firstName} ${applicationUser.lastName}`,

        firstName: applicationUser.firstName,
        lastName: applicationUser.lastName,

        accountType: "staff" as const,

        /*
         * School context.
         *
         * A platform-only super_admin intentionally has no
         * schoolId, membershipId, or schoolName.
         */
        schoolId: primaryMembership?.schoolId,
        membershipId: primaryMembership?.membershipId,
        schoolName: primaryMembership?.schoolName,

        /*
         * Platform role takes precedence over a school role.
         */
        role:
          platformRole ??
          primaryMembership?.role,

        platformRole:
          applicationUser.platformRole ?? undefined,

        isPlatformAdmin,
        isSuperAdmin,

        schoolMemberships: memberships,
      } satisfies ApplicationUser,
    };
  }

  /*
   * STUDENT
   */
  const [student] = await db
    .select({
      studentId: studentUserAccounts.studentId,
      email: studentUserAccounts.email,
      studentNumber: students.studentNumber,
      firstName: students.firstName,
      lastName: students.lastName,
      schoolId: students.schoolId,
      status: studentUserAccounts.status,
      mustChangePassword:
        studentUserAccounts.mustChangePassword,
    })
    .from(studentUserAccounts)
    .innerJoin(
      students,
      eq(students.id, studentUserAccounts.studentId),
    )
    .where(
      and(
        eq(studentUserAccounts.email, email),
        eq(studentUserAccounts.status, "active"),
      ),
    )
    .limit(1);

  if (student) {
    return {
      user: {
        id: authUser.id,
        authUserId: authUser.id,
        email,

        name: `${student.firstName} ${student.lastName}`,

        firstName: student.firstName,
        lastName: student.lastName,

        accountType: "student" as const,

        schoolId: student.schoolId,

        studentNumber: student.studentNumber,

        mustChangePassword:
          student.mustChangePassword,

        isSuperAdmin: false,
        isPlatformAdmin: false,
      } satisfies ApplicationUser,
    };
  }

  /*
   * GUARDIAN
   */
  const [guardian] = await db
    .select({
      guardianId: guardianUserAccounts.guardianId,
      email: guardianUserAccounts.email,
      firstName: guardians.firstName,
      lastName: guardians.lastName,
      schoolId: guardians.schoolId,
      status: guardianUserAccounts.status,
      mustChangePassword:
        guardianUserAccounts.mustChangePassword,
    })
    .from(guardianUserAccounts)
    .innerJoin(
      guardians,
      eq(guardians.id, guardianUserAccounts.guardianId),
    )
    .where(
      and(
        eq(guardianUserAccounts.email, email),
        eq(guardianUserAccounts.status, "active"),
      ),
    )
    .limit(1);

  if (!guardian) {
    return null;
  }

  const guardianChildren = await db
    .select({
      id: students.id,
      studentNumber: students.studentNumber,
      firstName: students.firstName,
      lastName: students.lastName,
      schoolId: students.schoolId,
    })
    .from(studentGuardians)
    .innerJoin(
      students,
      eq(students.id, studentGuardians.studentId),
    )
    .where(
      and(
        eq(
          studentGuardians.guardianId,
          guardian.guardianId,
        ),
        eq(
          students.schoolId,
          guardian.schoolId,
        ),
      ),
    )
    .orderBy(
      students.firstName,
      students.lastName,
    );

  return {
    user: {
      id: guardian.guardianId,
      authUserId: authUser.id,
      email,

      name: `${guardian.firstName} ${guardian.lastName}`,

      firstName: guardian.firstName,
      lastName: guardian.lastName,

      accountType: "guardian" as const,

      schoolId: guardian.schoolId,

      guardianId: guardian.guardianId,

      children: guardianChildren,

      mustChangePassword:
        guardian.mustChangePassword,

      isSuperAdmin: false,
      isPlatformAdmin: false,
    } satisfies ApplicationUser,
  };
}

export async function signOutApplication() {
  await getNeonAuth().signOut();
}