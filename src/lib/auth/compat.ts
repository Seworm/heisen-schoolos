import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  schoolMemberships,
  schools,
  studentUserAccounts,
  users,
  students,
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
  accountType: "staff" | "student";
  schoolId?: string;
  schoolName?: string;
  membershipId?: string;
  role?: string;
  isSuperAdmin?: boolean;
  schoolMemberships?: Array<{
    membershipId: string;
    schoolId: string;
    schoolName: string;
    role: string;
  }>;
  studentNumber?: string;
  mustChangePassword?: boolean;
};

export async function getApplicationSession() {
  const { data } = await getNeonAuth().getSession();
  const authUser = data?.user;

  if (!authUser?.email) {
    return null;
  }

  const email = authUser.email.trim().toLowerCase();

  const [applicationUser] = await db
    .select({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      status: users.status,
    })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (applicationUser) {
    if (applicationUser.status !== "active") {
      return null;
    }

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

    if (memberships.length === 0) {
      return null;
    }

    const platformMembership = memberships.find((membership) =>
      PLATFORM_ROLES.includes(
        membership.role as (typeof PLATFORM_ROLES)[number],
      ),
    );

    const primaryMembership = platformMembership ?? memberships[0];

    return {
      user: {
        id: applicationUser.id,
        authUserId: authUser.id,
        email,
        name: `${applicationUser.firstName} ${applicationUser.lastName}`,
        firstName: applicationUser.firstName,
        lastName: applicationUser.lastName,
        accountType: "staff" as const,
        schoolId: primaryMembership.schoolId,
        membershipId: primaryMembership.membershipId,
        role: primaryMembership.role,
        schoolName: primaryMembership.schoolName,
        isSuperAdmin: Boolean(platformMembership),
        schoolMemberships: memberships,
      } satisfies ApplicationUser,
    };
  }

  const [student] = await db
    .select({
      studentId: studentUserAccounts.studentId,
      email: studentUserAccounts.email,
      studentNumber: students.studentNumber,
      firstName: students.firstName,
      lastName: students.lastName,
      schoolId: students.schoolId,
      status: studentUserAccounts.status,
      mustChangePassword: studentUserAccounts.mustChangePassword,
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

  if (!student) {
    return null;
  }

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
      mustChangePassword: student.mustChangePassword,
      isSuperAdmin: false,
    } satisfies ApplicationUser,
  };
}

export async function signOutApplication() {
  await getNeonAuth().signOut();
}