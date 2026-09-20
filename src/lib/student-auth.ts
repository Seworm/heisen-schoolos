import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { auth } from "@/../auth";
import { db } from "@/db";
import { studentUserAccounts } from "@/db/schema";

export async function requireStudentSession() {
  const session = await auth();

  if (!session?.user) {
    redirect("/student/login");
  }

  if (session.user.accountType !== "student") {
    redirect("/dashboard");
  }

  return session;
}

export async function requireCurrentStudent() {
  const session = await requireStudentSession();

  const email = session.user.email;

  if (!email) {
    redirect("/student/login");
  }

  const account = await db
    .select({
      studentId: studentUserAccounts.studentId,
    })
    .from(studentUserAccounts)
    .where(eq(studentUserAccounts.email, email))
    .limit(1);

  const studentId = account[0]?.studentId;

  if (!studentId) {
    redirect("/student/login");
  }

  return {
    session,
    studentId,
  };
}
