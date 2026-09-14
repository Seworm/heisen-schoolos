"use server";

import { and, eq, ne } from "drizzle-orm";
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

export async function updateStreamAssignment(
  _previousState: FormState,
  formData: FormData,
): Promise<FormState> {
  const school = await requireCurrentSchool();

  const classId = String(
    formData.get("classId") ?? "",
  ).trim();

  const assignmentId = String(
    formData.get("assignmentId") ?? "",
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

  const subjectId = subjectIdValue || null;

  if (
    !classId ||
    !assignmentId ||
    !streamId ||
    !academicYearId ||
    !staffId
  ) {
    return {
      error:
        "Class, assignment, stream, academic year and teacher are required.",
    };
  }

  if (
    assignmentType !== "subject" &&
    assignmentType !== "class_teacher"
  ) {
    return {
      error: "Invalid assignment type.",
    };
  }

  if (
    assignmentType === "subject" &&
    !subjectId
  ) {
    return {
      error:
        "Select a subject for a subject teacher.",
    };
  }

  if (
    assignmentType === "class_teacher" &&
    subjectId
  ) {
    return {
      error:
        "A class teacher assignment cannot have a subject.",
    };
  }

  const [assignment] = await db
    .select({
      id: teacherAssignments.id,
      streamId: teacherAssignments.streamId,
      academicYearId:
        teacherAssignments.academicYearId,
      classId: streams.classLevelId,
    })
    .from(teacherAssignments)
    .innerJoin(
      streams,
      eq(
        teacherAssignments.streamId,
        streams.id,
      ),
    )
    .innerJoin(
      classLevels,
      eq(
        streams.classLevelId,
        classLevels.id,
      ),
    )
    .where(
      and(
        eq(
          teacherAssignments.id,
          assignmentId,
        ),
        eq(
          teacherAssignments.streamId,
          streamId,
        ),
        eq(
          streams.classLevelId,
          classId,
        ),
        eq(
          teacherAssignments.academicYearId,
          academicYearId,
        ),
        eq(
          classLevels.schoolId,
          school.id,
        ),
      ),
    )
    .limit(1);

  if (!assignment) {
    return {
      error: "Teaching assignment not found.",
    };
  }

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
      ),
    )
    .limit(1);

  if (!academicYear) {
    return {
      error: "Academic year not found.",
    };
  }

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
   * Subject assignments must belong to the curriculum
   * of this class.
   */
  if (subjectId) {
    const [classSubject] = await db
      .select({
        id: classSubjects.id,
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
   * Only one class teacher can exist for a stream
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
            ne(
              teacherAssignments.id,
              assignmentId,
            ),
          ),
        )
        .limit(1);

    if (existingClassTeacher) {
      return {
        error:
          "This stream already has another class teacher for this academic year.",
      };
    }
  }

  /*
   * Prevent duplicate subject assignments.
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
            teacherAssignments.academicYearId,
            academicYearId,
          ),
          eq(
            teacherAssignments.subjectId,
            subjectId,
          ),
          ne(
            teacherAssignments.id,
            assignmentId,
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
   * Prevent duplicate class-teacher assignments.
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
            ne(
              teacherAssignments.id,
              assignmentId,
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

  try {
    await db
      .update(teacherAssignments)
      .set({
        staffId,
        subjectId,
        isClassTeacher:
          assignmentType === "class_teacher",
      })
      .where(
        and(
          eq(
            teacherAssignments.id,
            assignmentId,
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
  } catch (error) {
    console.error(
      "Failed to update teaching assignment:",
      error,
    );

    return {
      error:
        "The teaching assignment could not be updated. Please try again.",
    };
  }

  redirect(
    `/academics/classes/${classId}/streams/${streamId}`,
  );
}