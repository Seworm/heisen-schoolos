import { eq } from "drizzle-orm";
import { db } from "@/db";
import {
  academicYears,
  promotionDecisions,
  studentEnrollments,
} from "@/db/schema";

export async function promoteStudent(input: {
  schoolId: string;
  studentId: string;
  fromEnrollmentId: string;
  toEnrollmentId: string;
  status: "promoted" | "repeated" | "withdrawn" | "transferred";
  actorId: string;
  reason?: string;
}) {
  return db.transaction(async (tx) => {
    const [from] = await tx
      .select({
        enrollment: studentEnrollments,
        schoolId: academicYears.schoolId,
      })
      .from(studentEnrollments)
      .innerJoin(
        academicYears,
        eq(studentEnrollments.academicYearId, academicYears.id),
      )
      .where(eq(studentEnrollments.id, input.fromEnrollmentId))
      .limit(1);

    const [to] = await tx
      .select({
        enrollment: studentEnrollments,
        schoolId: academicYears.schoolId,
      })
      .from(studentEnrollments)
      .innerJoin(
        academicYears,
        eq(studentEnrollments.academicYearId, academicYears.id),
      )
      .where(eq(studentEnrollments.id, input.toEnrollmentId))
      .limit(1);

    if (
      !from ||
      from.schoolId !== input.schoolId ||
      from.enrollment.studentId !== input.studentId
    ) {
      throw new Error(
        "Source enrollment is invalid for this school/student.",
      );
    }

    if (
      !to ||
      to.schoolId !== input.schoolId ||
      to.enrollment.studentId !== input.studentId
    ) {
      throw new Error(
        "Destination enrollment is invalid for this school/student.",
      );
    }

    if (from.enrollment.id === to.enrollment.id) {
      throw new Error(
        "Source and destination enrollments must be different.",
      );
    }

    await tx
      .update(studentEnrollments)
      .set({
        status: "completed",
        updatedAt: new Date(),
      })
      .where(eq(studentEnrollments.id, from.enrollment.id));

    await tx
      .update(studentEnrollments)
      .set({
        status: "active",
        updatedAt: new Date(),
      })
      .where(eq(studentEnrollments.id, to.enrollment.id));

    const [decision] = await tx
      .insert(promotionDecisions)
      .values({
        schoolId: input.schoolId,
        studentId: input.studentId,
        fromEnrollmentId: from.enrollment.id,
        toEnrollmentId: to.enrollment.id,
        status: input.status,
        decisionDate: new Date().toISOString().slice(0, 10),
        reason: input.reason ?? null,
        actorId: input.actorId,
      })
      .returning();

    return decision;
  });
}

