"use server";

import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { db } from "@/db";
import {
  academicYears,
  classLevels,
  classSubjects,
  staff,
  streams,
  subjects,
  teacherAssignments,
} from "@/db/schema";
import { requireCurrentSchool } from "@/lib/current-school";

type FormState = {
  error?: string;
};

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function createStreamAssignment(
  _previousState: FormState,
  formData: FormData,
): Promise<FormState> {
  const school = await requireCurrentSchool();

  const classId = String(
    formData.get("classId") ?? "",
  ).trim();

  const streamId = String(
    formData.get("streamId") ?? "",
  ).trim();

  const academicYearId = String(
    formData.get("academicYearId") ?? "",
  ).trim();

  const staffId = String(
    formData.get("staffId") ?? "",
  ).trim();

  const subjectIdValue = String(
    formData.get("subjectId") ?? "",
  ).trim();

  const assignmentType = String(
    formData.get("assignmentType") ?? "",
  ).trim();
  const lessonsPerWeek = Number(formData.get("lessonsPerWeek") ?? 1);

  const subjectId = subjectIdValue || null;

  /*
   * Basic required-field validation.
   */
  if (
    !classId ||
    !streamId ||
    !academicYearId ||
    !staffId
  ) {
    return {
      error:
        "Class, stream, academic year and teacher are required.",
    };
  }

  /*
   * Validate all database identifiers before sending them
   * to PostgreSQL.
   */
  if (
    !UUID_REGEX.test(classId) ||
    !UUID_REGEX.test(streamId) ||
    !UUID_REGEX.test(academicYearId) ||
    !UUID_REGEX.test(staffId)
  ) {
    return {
      error: "Invalid assignment details.",
    };
  }

  if (
    subjectId &&
    !UUID_REGEX.test(subjectId)
  ) {
    return {
      error: "Invalid subject.",
    };
  }

  /*
   * Validate assignment type.
   */
  if (
    assignmentType !== "subject" &&
    assignmentType !== "class_teacher"
  ) {
    return {
      error: "Invalid assignment type.",
    };
  }

  /*
   * Subject teachers must have a subject.
   */
  if (
    assignmentType === "subject" &&
    !subjectId
  ) {
    return {
      error:
        "Select a subject for a subject teacher.",
    };
  }

  /*
   * Class teachers must not have a subject.
   */
  if (
    assignmentType === "class_teacher" &&
    subjectId
  ) {
    return {
      error:
        "A class teacher assignment cannot have a subject.",
    };
  }

  if (!Number.isInteger(lessonsPerWeek) || lessonsPerWeek < 1 || lessonsPerWeek > 15) {
    return { error: "Periods per week must be between 1 and 15." };
  }

  /*
   * Verify that the stream belongs to the requested
   * class and that the class belongs to the current school.
   */
  const [streamResult] = await db
    .select({
      streamId: streams.id,
      classId: classLevels.id,
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
        eq(streams.classLevelId, classId),
        eq(classLevels.schoolId, school.id),
      ),
    )
    .limit(1);

  if (!streamResult) {
    return {
      error: "Stream not found.",
    };
  }

  /*
   * Verify that the academic year belongs to this school
   * and is the current academic year.
   */
  const [academicYear] = await db
    .select({
      id: academicYears.id,
    })
    .from(academicYears)
    .where(
      and(
        eq(
          academicYears.id,
          academicYearId,
        ),
        eq(
          academicYears.schoolId,
          school.id,
        ),
        eq(
          academicYears.isCurrent,
          true,
        ),
      ),
    )
    .limit(1);

  if (!academicYear) {
    return {
      error:
        "The selected academic year is not the current academic year.",
    };
  }

  /*
   * Verify that the teacher belongs to this school
   * and is currently active.
   */
  const [teacher] = await db
    .select({
      id: staff.id,
    })
    .from(staff)
    .where(
      and(
        eq(staff.id, staffId),
        eq(staff.schoolId, school.id),
        eq(staff.status, "active"),
      ),
    )
    .limit(1);

  if (!teacher) {
    return {
      error: "Teacher not found.",
    };
  }

  /*
   * Subject assignments must use a subject from the
   * school's subject catalogue and the subject must be
   * offered to this class.
   */
  if (subjectId) {
    const [classSubject] = await db
      .select({
        id: classSubjects.id,
        subjectId: subjects.id,
      })
      .from(classSubjects)
      .innerJoin(
        subjects,
        eq(
          classSubjects.subjectId,
          subjects.id,
        ),
      )
      .where(
        and(
          eq(
            classSubjects.classLevelId,
            classId,
          ),
          eq(
            classSubjects.subjectId,
            subjectId,
          ),
          eq(
            subjects.schoolId,
            school.id,
          ),
        ),
      )
      .limit(1);

    if (!classSubject) {
      return {
        error:
          "This subject is not offered to this class.",
      };
    }
  }

  /*
   * Only one class teacher may exist for a stream
   * in an academic year.
   */
  if (assignmentType === "class_teacher") {
    const [existingClassTeacher] =
      await db
        .select({
          id: teacherAssignments.id,
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
      return {
        error:
          "This stream already has a class teacher for this academic year.",
      };
    }
  }

  /*
   * Prevent the same teacher from being assigned to the
   * same subject in the same stream and academic year.
   */
  if (subjectId) {
    const [duplicate] = await db
      .select({
        id: teacherAssignments.id,
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
            teacherAssignments.subjectId,
            subjectId,
          ),
          eq(
            teacherAssignments.academicYearId,
            academicYearId,
          ),
        ),
      )
      .limit(1);

    if (duplicate) {
      return {
        error:
          "This teacher is already assigned to this subject in this stream.",
      };
    }
  }

  /*
   * Prevent duplicate class-teacher assignments for
   * the same teacher, stream and academic year.
   */
  if (assignmentType === "class_teacher") {
    const [duplicateClassTeacher] =
      await db
        .select({
          id: teacherAssignments.id,
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
            eq(
              teacherAssignments.isClassTeacher,
              true,
            ),
          ),
        )
        .limit(1);

    if (duplicateClassTeacher) {
      return {
        error:
          "This teacher is already the class teacher for this stream.",
      };
    }
  }

  /*
   * Create the assignment.
   */
  try {
    await db.insert(teacherAssignments).values({
      staffId,
      streamId,
      subjectId,
      academicYearId,
      isClassTeacher:
        assignmentType === "class_teacher",
      lessonsPerWeek,
    });
  } catch (error) {
    console.error(
      "Failed to create teaching assignment:",
      error,
    );

    return {
      error:
        "The teaching assignment could not be created. Please try again.",
    };
  }

  /*
   * Return to the stream detail page after success.
   */
  redirect(
    `/academics/classes/${classId}/streams/${streamId}`,
  );
}