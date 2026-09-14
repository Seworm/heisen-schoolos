"use server";

import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import {
  guardians,
  studentGuardians,
  students,
} from "@/db/schema";
import { requireCurrentSchool } from "@/lib/current-school";

type ActionResult = {
  error?: string;
  success?: string;
};

async function getStudentForSchool(studentId: string) {
  const school = await requireCurrentSchool();

  const [student] = await db
    .select({
      id: students.id,
    })
    .from(students)
    .where(
      and(
        eq(students.id, studentId),
        eq(students.schoolId, school.id),
      ),
    )
    .limit(1);

  return {
    school,
    student,
  };
}

export async function setPrimaryGuardian(
  studentId: string,
  guardianId: string,
): Promise<ActionResult> {
  const { school, student } =
    await getStudentForSchool(studentId);

  if (!student) {
    return {
      error: "Student not found.",
    };
  }

  const [relationship] = await db
    .select({
      guardianId: studentGuardians.guardianId,
    })
    .from(studentGuardians)
    .innerJoin(
      guardians,
      eq(studentGuardians.guardianId, guardians.id),
    )
    .where(
      and(
        eq(studentGuardians.studentId, student.id),
        eq(studentGuardians.guardianId, guardianId),
        eq(guardians.schoolId, school.id),
      ),
    )
    .limit(1);

  if (!relationship) {
    return {
      error: "Guardian is not associated with this student.",
    };
  }

  try {
    await db.transaction(async (tx) => {
      await tx
        .update(studentGuardians)
        .set({
          isPrimary: false,
        })
        .where(
          and(
            eq(studentGuardians.studentId, student.id),
            eq(studentGuardians.isPrimary, true),
          ),
        );

      await tx
        .update(studentGuardians)
        .set({
          isPrimary: true,
        })
        .where(
          and(
            eq(studentGuardians.studentId, student.id),
            eq(studentGuardians.guardianId, guardianId),
          ),
        );
    });

    return {
      success: "Primary guardian updated.",
    };
  } catch (error) {
    console.error(
      "Failed to change primary guardian:",
      error,
    );

    return {
      error:
        "The primary guardian could not be changed. No changes were saved.",
    };
  }
}

export async function removeGuardian(
  studentId: string,
  guardianId: string,
): Promise<ActionResult> {
  const { school, student } =
    await getStudentForSchool(studentId);

  if (!student) {
    return {
      error: "Student not found.",
    };
  }

  const [relationship] = await db
    .select({
      guardianId: studentGuardians.guardianId,
    })
    .from(studentGuardians)
    .innerJoin(
      guardians,
      eq(studentGuardians.guardianId, guardians.id),
    )
    .where(
      and(
        eq(studentGuardians.studentId, student.id),
        eq(studentGuardians.guardianId, guardianId),
        eq(guardians.schoolId, school.id),
      ),
    )
    .limit(1);

  if (!relationship) {
    return {
      error: "Guardian is not associated with this student.",
    };
  }

  await db
    .delete(studentGuardians)
    .where(
      and(
        eq(studentGuardians.studentId, student.id),
        eq(studentGuardians.guardianId, guardianId),
      ),
    );

  return {
    success: "Guardian removed from this student.",
  };
}