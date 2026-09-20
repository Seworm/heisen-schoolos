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

export async function getApplicationSession() {
  const { data } = await getNeonAuth().getSession();
  const authUser = data?.user;

  if (!authUser?.email) {
    return null;
  }

  const email = authUser.email.trim().toLowerCase();

  /*
   * Staff/admin users are stored in the application users table.
   * Check this first so normal staff requests do not depend on
   * the student authentication tables.
   */
  const [applicationUser] = await db
    .select({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
    })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (applicationUser) {
    const [membership] = await db
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
      )
      .limit(1);

    if (!membership) {
      return null;
    }

    return {
      user: {
        id: applicationUser.id,
        authUserId: authUser.id,
        email,
        name: `${applicationUser.firstName} ${applicationUser.lastName}`,
        firstName: applicationUser.firstName,
        lastName: applicationUser.lastName,
        accountType: "staff" as const,
        schoolId: membership.schoolId,
        membershipId: membership.membershipId,
        role: membership.role,
        schoolName: membership.schoolName,
      },
    };
  }

  /*
   * If the email is not an application staff/admin account,
   * check whether it belongs to a student account.
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
      email,
      name: `${student.firstName} ${student.lastName}`,
      firstName: student.firstName,
      lastName: student.lastName,
      accountType: "student" as const,
      schoolId: student.schoolId,
      studentNumber: student.studentNumber,
      mustChangePassword: student.mustChangePassword,
    },
  };
}

export async function signOutApplication() {
  await getNeonAuth().signOut();
}