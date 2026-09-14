"use server";

import { and, eq, sql } from "drizzle-orm";
import { redirect } from "next/navigation";

import { db } from "@/db";
import {
  academicYears,
  classLevels,
  staff,
  streams,
  subjects,
  teacherAssignments,
} from "@/db/schema";
import { requireCurrentSchool } from "@/lib/current-school";

type FormState = {
  error?: string;
};

export async function createTeacherAssignment(
  staffId: string,
  _previousState: FormState,
  formData: FormData,
): Promise<FormState> {
  const school = await requireCurrentSchool();

  if (!staffId) {
    return {
      error: "Staff member could not be identified.",
    };
  }

  const academicYearId = String(
    formData.get("academicYearId") ?? "",
  ).trim();

  const streamId = String(
    formData.get("streamId") ?? "",
  ).trim();

  const subjectIdValue = String(
    formData.get("subjectId") ?? "",
  ).trim();

  const isClassTeacher =
    formData.get("isClassTeacher") === "true";

  if (!academicYearId) {
    return {
      error: "Academic year is required.",
    };
  }

  if (!streamId) {
    return {
      error: "Class / stream is required.",
    };
  }

  try {
    await db.transaction(async (tx) => {
      // ------------------------------------------------------------
      // Verify staff belongs to current school
      // ------------------------------------------------------------

      const [staffMember] = await tx
        .select({
          id: staff.id,
        })
        .from(staff)
        .where(
          and(
            eq(staff.id, staffId),
            eq(staff.schoolId, school.id),
          ),
        )
        .limit(1);

      if (!staffMember) {
        throw new Error(
          "The staff member was not found in the current school.",
        );
      }

      // ------------------------------------------------------------
      // Assignment must be either:
      // - subject assignment
      // - class teacher assignment
      // ------------------------------------------------------------

      if (!subjectIdValue && !isClassTeacher) {
        throw new Error(
          "Select a subject or mark the assignment as a class teacher assignment.",
        );
      }

      // ------------------------------------------------------------
      // Verify academic year belongs to current school
      // ------------------------------------------------------------

      const [academicYear] = await tx
        .select({
          id: academicYears.id,
        })
        .from(academicYears)
        .where(
          and(
            eq(academicYears.id, academicYearId),
            eq(academicYears.schoolId, school.id),
          ),
        )
        .limit(1);

      if (!academicYear) {
        throw new Error(
          "The academic year was not found in the current school.",
        );
      }

      // ------------------------------------------------------------
      // Verify stream belongs to current school
      // ------------------------------------------------------------

      const [stream] = await tx
        .select({
          id: streams.id,
          classLevelId: classLevels.id,
        })
        .from(streams)
        .innerJoin(
          classLevels,
          eq(
            streams.classLevelId,
            classLevels.id,
          ),
        )
        .where(
          and(
            eq(streams.id, streamId),
            eq(classLevels.schoolId, school.id),
          ),
        )
        .limit(1);

      if (!stream) {
        throw new Error(
          "The selected class was not found in the current school.",
        );
      }

      // ------------------------------------------------------------
      // Verify subject belongs to current school
      // ------------------------------------------------------------

      if (subjectIdValue) {
        const [subject] = await tx
          .select({
            id: subjects.id,
          })
          .from(subjects)
          .where(
            and(
              eq(subjects.id, subjectIdValue),
              eq(subjects.schoolId, school.id),
            ),
          )
          .limit(1);

        if (!subject) {
          throw new Error(
            "The selected subject was not found in the current school.",
          );
        }
      }

      // ------------------------------------------------------------
      // Lock class-teacher assignment for this stream/year
      // ------------------------------------------------------------

      if (isClassTeacher) {
        await tx.execute(
          sql`
            SELECT pg_advisory_xact_lock(
              hashtext(
                ${`heisen-schoolos:class-teacher:${streamId}:${academicYearId}`}
              )
            )
          `,
        );

        const [existingClassTeacher] = await tx
          .select({
            id: teacherAssignments.id,
            staffId: teacherAssignments.staffId,
          })
          .from(teacherAssignments)
          .where(
            and(
              eq(
                teacherAssignments.streamId,
                streamId,
              ),
              eq(
                teacherAssignments.academicYearId,
                academicYearId,
              ),
              eq(
                teacherAssignments.isClassTeacher,
                true,
              ),
            ),
          )
          .limit(1);

        if (existingClassTeacher) {
          if (
            existingClassTeacher.staffId === staffId
          ) {
            throw new Error(
              "This staff member is already the class teacher for this class.",
            );
          }

          throw new Error(
            "This class already has a class teacher for the selected academic year.",
          );
        }
      }

      // ------------------------------------------------------------
      // Check duplicate assignment
      // ------------------------------------------------------------

      const existingAssignments = await tx
        .select({
          id: teacherAssignments.id,
          subjectId: teacherAssignments.subjectId,
          isClassTeacher:
            teacherAssignments.isClassTeacher,
        })
        .from(teacherAssignments)
        .where(
          and(
            eq(
              teacherAssignments.staffId,
              staffId,
            ),
            eq(
              teacherAssignments.streamId,
              streamId,
            ),
            eq(
              teacherAssignments.academicYearId,
              academicYearId,
            ),
          ),
        );

      const duplicate = existingAssignments.some(
        (assignment) => {
          const sameSubject =
            assignment.subjectId ===
            (subjectIdValue || null);

          const sameRole =
            assignment.isClassTeacher ===
            isClassTeacher;

          return sameSubject && sameRole;
        },
      );

      if (duplicate) {
        throw new Error(
          "This teacher already has this assignment.",
        );
      }

      // ------------------------------------------------------------
      // Create assignment
      // ------------------------------------------------------------

      const [createdAssignment] = await tx
        .insert(teacherAssignments)
        .values({
          staffId,
          streamId,
          subjectId: subjectIdValue || null,
          academicYearId,
          isClassTeacher,
        })
        .returning({
          id: teacherAssignments.id,
        });

      if (!createdAssignment) {
        throw new Error(
          "The teacher assignment could not be created.",
        );
      }
    });
  } catch (error) {
    console.error(
      "Failed to create teacher assignment:",
      error,
    );

    return {
      error:
        error instanceof Error
          ? error.message
          : "The teacher assignment could not be created.",
    };
  }

  // IMPORTANT:
  // Keep redirect OUTSIDE the try/catch.
  redirect(`/staff/${staffId}/assignments`);
}