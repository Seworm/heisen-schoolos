"use server";

import { and, eq, sql } from "drizzle-orm";
import { redirect } from "next/navigation";

import { db } from "@/db";
import {
  academicYears,
  attendanceRecords,
  attendanceSessions,
  classLevels,
  studentEnrollments,
  studentPlacements,
  students,
  streams,
  terms,
} from "@/db/schema";
import { requireCurrentSchool } from "@/lib/current-school";

type ActionState = {
  error?: string;
};

const VALID_STATUSES = [
  "present",
  "absent",
  "late",
  "excused",
] as const;

type AttendanceStatus = (typeof VALID_STATUSES)[number];

function isValidDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00Z`);

  if (Number.isNaN(date.getTime())) {
    return false;
  }

  return date.toISOString().slice(0, 10) === value;
}

function isAttendanceStatus(
  value: string,
): value is AttendanceStatus {
  return (
    VALID_STATUSES as readonly string[]
  ).includes(value);
}

function isDateWithinRange(
  value: string,
  start: string,
  end: string,
) {
  return value >= start && value <= end;
}

function readNote(
  formData: FormData,
  studentId: string,
) {
  const value = String(
    formData.get(`note_${studentId}`) ?? "",
  ).trim();

  if (!value) {
    return null;
  }

  return value.slice(0, 500);
}

async function getCurrentAcademicContext(
  schoolId: string,
) {
  const [academicYear] = await db
    .select({
      id: academicYears.id,
      name: academicYears.name,
      startDate: academicYears.startDate,
      endDate: academicYears.endDate,
    })
    .from(academicYears)
    .where(
      and(
        eq(academicYears.schoolId, schoolId),
        eq(academicYears.isCurrent, true),
      ),
    )
    .limit(1);

  if (!academicYear) {
    return null;
  }

  const [term] = await db
    .select({
      id: terms.id,
      name: terms.name,
      startDate: terms.startDate,
      endDate: terms.endDate,
    })
    .from(terms)
    .where(
      and(
        eq(
          terms.academicYearId,
          academicYear.id,
        ),
        eq(terms.isCurrent, true),
      ),
    )
    .limit(1);

  if (!term) {
    return null;
  }

  return {
    academicYear,
    term,
  };
}

async function getSchoolStream(
  schoolId: string,
  streamId: string,
) {
  const [stream] = await db
    .select({
      id: streams.id,
      name: streams.name,
      classLevelId: classLevels.id,
      className: classLevels.name,
      classCategory: classLevels.category,
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
        eq(classLevels.schoolId, schoolId),
      ),
    )
    .limit(1);

  return stream ?? null;
}

export async function saveAttendance(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const streamId = String(
    formData.get("streamId") ?? "",
  ).trim();

  const attendanceDate = String(
    formData.get("attendanceDate") ?? "",
  ).trim();

  if (!streamId) {
    return {
      error: "A stream is required.",
    };
  }

  if (!isValidDate(attendanceDate)) {
    return {
      error: "A valid attendance date is required.",
    };
  }

  const school = await requireCurrentSchool();

  const context =
    await getCurrentAcademicContext(
      school.id,
    );

  if (!context) {
    return {
      error:
        "A current academic year and current term must be configured before attendance can be taken.",
    };
  }

  const { academicYear, term } = context;

  if (
    !isDateWithinRange(
      attendanceDate,
      academicYear.startDate,
      academicYear.endDate,
    )
  ) {
    return {
      error:
        "The attendance date must fall within the current academic year.",
    };
  }

  if (
    !isDateWithinRange(
      attendanceDate,
      term.startDate,
      term.endDate,
    )
  ) {
    return {
      error:
        "The attendance date must fall within the current term.",
    };
  }

  const stream = await getSchoolStream(
    school.id,
    streamId,
  );

  if (!stream) {
    return {
      error:
        "The selected stream does not belong to this school.",
    };
  }

  const studentsInStream = await db
    .select({
      id: students.id,
    })
    .from(studentPlacements)
    .innerJoin(
      studentEnrollments,
      eq(
        studentPlacements.studentEnrollmentId,
        studentEnrollments.id,
      ),
    )
    .innerJoin(
      students,
      eq(
        studentEnrollments.studentId,
        students.id,
      ),
    )
    .where(
      and(
        eq(
          studentPlacements.streamId,
          streamId,
        ),
        eq(
          studentPlacements.status,
          "active",
        ),
        eq(
          studentEnrollments.academicYearId,
          academicYear.id,
        ),
        eq(
          studentEnrollments.status,
          "active",
        ),
        eq(
          students.schoolId,
          school.id,
        ),
      ),
    );

  if (studentsInStream.length === 0) {
    return {
      error:
        "There are no active students in this stream.",
    };
  }

  const validStudentIds = new Set(
    studentsInStream.map(
      (student) => student.id,
    ),
  );

  const submittedRecords: {
    studentId: string;
    status: AttendanceStatus;
    note: string | null;
  }[] = [];

  for (const student of studentsInStream) {
    const status = String(
      formData.get(
        `status_${student.id}`,
      ) ?? "",
    ).trim();

    if (!isAttendanceStatus(status)) {
      return {
        error:
          "One or more attendance statuses are invalid.",
      };
    }

    submittedRecords.push({
      studentId: student.id,
      status,
      note: readNote(
        formData,
        student.id,
      ),
    });
  }

  for (const [key] of formData.entries()) {
    if (
      !key.startsWith("status_") &&
      !key.startsWith("note_")
    ) {
      continue;
    }

    const prefix = key.startsWith("status_")
      ? "status_"
      : "note_";

    const studentId = key.slice(
      prefix.length,
    );

    if (!validStudentIds.has(studentId)) {
      return {
        error:
          "Invalid student attendance data was submitted.",
      };
    }
  }

  let sessionId: string | null = null;

  try {
    await db.transaction(async (tx) => {
      await tx.execute(sql`
        SELECT pg_advisory_xact_lock(
          hashtext(
            ${`${school.id}:${streamId}:${attendanceDate}`}
          )
        )
      `);

      const [existingSession] = await tx
        .select({
          id: attendanceSessions.id,
          status: attendanceSessions.status,
          academicYearId:
            attendanceSessions.academicYearId,
          termId: attendanceSessions.termId,
        })
        .from(attendanceSessions)
        .where(
          and(
            eq(
              attendanceSessions.schoolId,
              school.id,
            ),
            eq(
              attendanceSessions.streamId,
              streamId,
            ),
            eq(
              attendanceSessions.attendanceDate,
              attendanceDate,
            ),
          ),
        )
        .limit(1);

      if (
        existingSession?.status ===
        "completed"
      ) {
        throw new Error(
          "ATTENDANCE_ALREADY_COMPLETED",
        );
      }

      if (
        existingSession?.status ===
        "cancelled"
      ) {
        throw new Error(
          "ATTENDANCE_ALREADY_CANCELLED",
        );
      }

      if (existingSession) {
        if (
          existingSession.academicYearId !==
            academicYear.id ||
          existingSession.termId !== term.id
        ) {
          throw new Error(
            "ATTENDANCE_CONTEXT_MISMATCH",
          );
        }

        sessionId = existingSession.id;

        await tx
          .update(attendanceSessions)
          .set({
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(
                attendanceSessions.id,
                existingSession.id,
              ),
              eq(
                attendanceSessions.schoolId,
                school.id,
              ),
            ),
          );
      } else {
        const [newSession] = await tx
          .insert(attendanceSessions)
          .values({
            schoolId: school.id,
            academicYearId:
              academicYear.id,
            termId: term.id,
            streamId,
            attendanceDate,
            status: "open",
          })
          .returning({
            id: attendanceSessions.id,
          });

        if (!newSession) {
          throw new Error(
            "ATTENDANCE_SESSION_CREATE_FAILED",
          );
        }

        sessionId = newSession.id;
      }

      if (!sessionId) {
        throw new Error(
          "ATTENDANCE_SESSION_ID_MISSING",
        );
      }

      await tx
        .delete(attendanceRecords)
        .where(
          eq(
            attendanceRecords.attendanceSessionId,
            sessionId,
          ),
        );

      await tx
        .insert(attendanceRecords)
        .values(
          submittedRecords.map(
            ({
              studentId,
              status,
              note,
            }) => ({
              attendanceSessionId:
                sessionId!,
              studentId,
              status,
              note,
            }),
          ),
        );

      await tx
        .update(attendanceSessions)
        .set({
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(
              attendanceSessions.id,
              sessionId,
            ),
            eq(
              attendanceSessions.schoolId,
              school.id,
            ),
          ),
        );
    });
  } catch (error) {
    console.error(
      "Failed to save attendance:",
      error,
    );

    if (
      error instanceof Error &&
      error.message ===
        "ATTENDANCE_ALREADY_COMPLETED"
    ) {
      return {
        error:
          "This attendance session has already been completed and can no longer be edited.",
      };
    }

    if (
      error instanceof Error &&
      error.message ===
        "ATTENDANCE_ALREADY_CANCELLED"
    ) {
      return {
        error:
          "This attendance session has been cancelled and can no longer be edited.",
      };
    }

    if (
      error instanceof Error &&
      error.message ===
        "ATTENDANCE_CONTEXT_MISMATCH"
    ) {
      return {
        error:
          "This attendance session belongs to a different academic term.",
      };
    }

    return {
      error:
        "Attendance could not be saved. Please try again.",
    };
  }

  redirect(
    `/attendance/${encodeURIComponent(
      sessionId!,
    )}`,
  );
}

export async function completeAttendance(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const sessionId = String(
    formData.get("sessionId") ?? "",
  ).trim();

  if (!sessionId) {
    return {
      error: "Attendance session is required.",
    };
  }

  const school = await requireCurrentSchool();

  try {
    const result =
      await db.transaction(async (tx) => {
        const [session] = await tx
          .select({
            id: attendanceSessions.id,
            status:
              attendanceSessions.status,
          })
          .from(attendanceSessions)
          .where(
            and(
              eq(
                attendanceSessions.id,
                sessionId,
              ),
              eq(
                attendanceSessions.schoolId,
                school.id,
              ),
            ),
          )
          .limit(1);

        if (!session) {
          throw new Error(
            "ATTENDANCE_SESSION_NOT_FOUND",
          );
        }

        if (session.status === "completed") {
          throw new Error(
            "ATTENDANCE_ALREADY_COMPLETED",
          );
        }

        if (session.status === "cancelled") {
          throw new Error(
            "ATTENDANCE_ALREADY_CANCELLED",
          );
        }

        const [recordCount] = await tx
          .select({
            count: sql<number>`count(*)`,
          })
          .from(attendanceRecords)
          .where(
            eq(
              attendanceRecords.attendanceSessionId,
              sessionId,
            ),
          );

        if (Number(recordCount?.count ?? 0) === 0) {
          throw new Error(
            "ATTENDANCE_NO_RECORDS",
          );
        }

        const [updated] = await tx
          .update(attendanceSessions)
          .set({
            status: "completed",
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(
                attendanceSessions.id,
                sessionId,
              ),
              eq(
                attendanceSessions.schoolId,
                school.id,
              ),
              eq(
                attendanceSessions.status,
                "open",
              ),
            ),
          )
          .returning({
            id: attendanceSessions.id,
          });

        return updated?.id ?? null;
      });

    if (!result) {
      return {
        error:
          "Attendance could not be completed.",
      };
    }
  } catch (error) {
    console.error(
      "Failed to complete attendance:",
      error,
    );

    if (
      error instanceof Error &&
      error.message ===
        "ATTENDANCE_SESSION_NOT_FOUND"
    ) {
      return {
        error:
          "Attendance session was not found.",
      };
    }

    if (
      error instanceof Error &&
      error.message ===
        "ATTENDANCE_NO_RECORDS"
    ) {
      return {
        error:
          "Attendance cannot be completed because no attendance records have been saved.",
      };
    }

    if (
      error instanceof Error &&
      error.message ===
        "ATTENDANCE_ALREADY_COMPLETED"
    ) {
      return {
        error:
          "This attendance session is already completed.",
      };
    }

    if (
      error instanceof Error &&
      error.message ===
        "ATTENDANCE_ALREADY_CANCELLED"
    ) {
      return {
        error:
          "This attendance session has been cancelled.",
      };
    }

    return {
      error:
        "Attendance could not be completed. Please try again.",
    };
  }

  redirect(
    `/attendance/${encodeURIComponent(
      sessionId,
    )}`,
  );
}

export async function cancelAttendance(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const sessionId = String(
    formData.get("sessionId") ?? "",
  ).trim();

  if (!sessionId) {
    return {
      error: "Attendance session is required.",
    };
  }

  const school = await requireCurrentSchool();

  try {
    const [updated] = await db
      .update(attendanceSessions)
      .set({
        status: "cancelled",
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(
            attendanceSessions.id,
            sessionId,
          ),
          eq(
            attendanceSessions.schoolId,
            school.id,
          ),
          eq(
            attendanceSessions.status,
            "open",
          ),
        ),
      )
      .returning({
        id: attendanceSessions.id,
      });

    if (!updated) {
      return {
        error:
          "Only an open attendance session can be cancelled.",
      };
    }
  } catch (error) {
    console.error(
      "Failed to cancel attendance:",
      error,
    );

    return {
      error:
        "Attendance could not be cancelled. Please try again.",
    };
  }

  redirect("/attendance");
}