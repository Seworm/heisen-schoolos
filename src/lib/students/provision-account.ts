import crypto from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { students, studentUserAccounts } from "@/db/schema";
import { getNeonAuth } from "@/lib/auth/server";

const STUDENT_AUTH_DOMAIN =
  process.env.STUDENT_AUTH_EMAIL_DOMAIN ??
  "students.heisen-schoolos.com";

function generateTemporaryPassword(length = 12) {
  const alphabet =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";

  const bytes = crypto.randomBytes(length);

  return Array.from(
    bytes,
    (byte) => alphabet[byte % alphabet.length],
  ).join("");
}

function getStudentAuthEmail(studentNumber: string) {
  const normalized = studentNumber.trim().toLowerCase();

  return `${normalized}@${STUDENT_AUTH_DOMAIN}`;
}

export async function provisionStudentAccount(studentId: string) {
  const [student] = await db
    .select({
      id: students.id,
      studentNumber: students.studentNumber,
      firstName: students.firstName,
      lastName: students.lastName,
    })
    .from(students)
    .where(eq(students.id, studentId))
    .limit(1);

  if (!student) {
    throw new Error("Student not found.");
  }

  const [existingAccount] = await db
    .select({
      id: studentUserAccounts.id,
      email: studentUserAccounts.email,
    })
    .from(studentUserAccounts)
    .where(eq(studentUserAccounts.studentId, student.id))
    .limit(1);

  if (existingAccount) {
    throw new Error("This student already has a user account.");
  }

  const email = getStudentAuthEmail(student.studentNumber);
  const temporaryPassword = generateTemporaryPassword();

  const neon = getNeonAuth();

  const signUp = await neon.signUp.email({
    email,
    password: temporaryPassword,
    name: `${student.firstName} ${student.lastName}`,
  });

  if (signUp.error) {
    throw new Error(
      signUp.error.message ||
        "Unable to create the student's authentication account.",
    );
  }

  try {
    await db.insert(studentUserAccounts).values({
      studentId: student.id,
      email,
      status: "active",
      mustChangePassword: true,
    });
  } catch (error) {
    throw new Error(
      error instanceof Error
        ? `Student account record could not be created: ${error.message}`
        : "Student account record could not be created.",
    );
  }

  return {
    studentId: student.id,
    studentNumber: student.studentNumber,
    temporaryPassword,
  };
}