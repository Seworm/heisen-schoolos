import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { auth } from "@/../auth";
import { db } from "@/db";
import {
  guardianUserAccounts,
  guardians,
  studentGuardians,
  students,
} from "@/db/schema";

export async function requireGuardianSession() {
  const session = await auth();

  if (!session?.user) {
    redirect("/guardian/login");
  }

  if (session.user.accountType !== "guardian") {
    redirect("/dashboard");
  }

  return session;
}

export async function requireCurrentGuardian() {
  const session = await requireGuardianSession();
  const email = session.user.email;

  if (!email) {
    redirect("/guardian/login");
  }

  const [account] = await db
    .select({
      guardianId: guardianUserAccounts.guardianId,
      schoolId: guardians.schoolId,
      firstName: guardians.firstName,
      lastName: guardians.lastName,
      status: guardianUserAccounts.status,
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

  if (!account) {
    redirect("/guardian/login");
  }

  const children = await db
    .select({
      id: students.id,
      studentNumber: students.studentNumber,
      firstName: students.firstName,
      middleName: students.middleName,
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
        eq(studentGuardians.guardianId, account.guardianId),
        eq(students.schoolId, account.schoolId),
      ),
    )
    .orderBy(students.firstName, students.lastName);

  return {
    session,
    guardianId: account.guardianId,
    schoolId: account.schoolId,
    firstName: account.firstName,
    lastName: account.lastName,
    children,
  };
}

export async function requireGuardianChildScope(childId: string, schoolId?: string) {
  const { session, guardianId, schoolId: activeSchoolId, children } = await requireCurrentGuardian();
  const selectedChild = children.find((child) => child.id === childId);

  if (!selectedChild) {
    redirect("/guardian/dashboard");
  }

  if (schoolId && schoolId !== activeSchoolId) {
    redirect("/guardian/dashboard");
  }

  if (selectedChild.schoolId !== activeSchoolId) {
    redirect("/guardian/dashboard");
  }

  return {
    session,
    guardianId,
    schoolId: activeSchoolId,
    child: selectedChild,
    children,
  };
}
