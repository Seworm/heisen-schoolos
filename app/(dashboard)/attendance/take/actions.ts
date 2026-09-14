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

type AttendanceStatus =
  (typeof VALID_STATUSES)[number];

function isValidDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isAttendanceStatus(
  value: string,
): value is AttendanceStatus {
  return (
    VALID_STATUSES as readonly string[]
  ).includes(value);
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

  if (
    !attendanceDate ||
    !isValidDate(attendanceDate)
  ) {
    return {
      error: "A valid attendance date is required.",
    };
  }

  const school = await requireCurrentSchool();

  /*
   * ------------------------------------------------------------
   * CURRENT ACADEMIC YEAR
   * ------------------------------------------------------------
   */

  const [academicYear] = await db
    .select()
    .from(academicYears)
    .where(
      and(
        eq(academicYears.schoolId, school.id),
        eq(academicYears.isCurrent, true),
      ),
    )
    .limit(1);

  if (!academicYear) {
    return {
      error:
        "No current academic year is configured.",
    };
  }

  /*
   * ------------------------------------------------------------
   * CURRENT TERM
   * ------------------------------------------------------------
   */

  const [term] = await db
    .select()
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
    return {
      error:
        "No current term is configured for the current academic year.",
    };
  }

  /*
   * ------------------------------------------------------------
   * VERIFY STREAM BELONGS TO CURRENT SCHOOL
   *
   * streams does not contain schoolId.
   * Ownership is established through classLevels.
   * ------------------------------------------------------------
   */

  const [stream] = await db
    .select({
      id: streams.id,
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
        eq(
          classLevels.schoolId,
          school.id,
        ),
      ),
    )
    .limit(1);

  if (!stream) {
    return {
      error:
        "The selected stream does not belong to this school.",
    };
  }

  /*
   * ------------------------------------------------------------
   * GET ACTIVE STUDENTS CURRENTLY PLACED IN THE STREAM
   * ------------------------------------------------------------
   */

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

  /*
   * ------------------------------------------------------------
   * VALID STUDENT IDs
   * ------------------------------------------------------------
   */

  const validStudentIds = new Set(
    studentsInStream.map(
      (student) => student.id,
    ),
  );

  /*
   * ------------------------------------------------------------
   * READ AND VALIDATE SUBMITTED ATTENDANCE
   * ------------------------------------------------------------
   */

  const submittedStatuses = new Map<
    string,
    AttendanceStatus
  >();

  for (const student of studentsInStream) {
    const value = String(
      formData.get(
        `status_${student.id}`,
      ) ?? "present",
    ).trim();

    if (!isAttendanceStatus(value)) {
      return {
        error:
          "One or more attendance statuses are invalid.",
      };
    }

    submittedStatuses.set(
      student.id,
      value,
    );
  }

  /*
   * Reject unexpected status_* fields.
   * This prevents a client from submitting attendance
   * for a student who does not belong to this register.
   */

  for (const [key] of formData.entries()) {
    if (!key.startsWith("status_")) {
      continue;
    }

    const studentId = key.slice(
      "status_".length,
    );

    if (!validStudentIds.has(studentId)) {
      return {
        error:
          "Invalid student attendance data was submitted.",
      };
    }
  }

  /*
   * ------------------------------------------------------------
   * SAVE ATTENDANCE
   * ------------------------------------------------------------
   */

  try {
    await db.transaction(async (tx) => {
      /*
       * Serialize attendance saves for the same
       * stream/date combination.
       *
       * This prevents two administrators from creating
       * duplicate sessions simultaneously.
       */
      await tx.execute(sql`
        SELECT pg_advisory_xact_lock(
          hashtext(
            ${`${school.id}:${streamId}:${attendanceDate}`}
          )
        )
      `);

      /*
       * --------------------------------------------------------
       * FIND EXISTING SESSION
       * --------------------------------------------------------
       */

      const [existingSession] = await tx
        .select({
          id: attendanceSessions.id,
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

      let sessionId: string;

      /*
       * --------------------------------------------------------
       * CREATE OR REOPEN SESSION
       * --------------------------------------------------------
       */

      if (existingSession) {
        sessionId = existingSession.id;

        await tx
          .update(attendanceSessions)
          .set({
            academicYearId:
              academicYear.id,
            termId: term.id,
            status: "open",
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
            "Attendance session could not be created.",
          );
        }

        sessionId = newSession.id;
      }

      /*
       * --------------------------------------------------------
       * REPLACE EXISTING RECORDS
       * --------------------------------------------------------
       *
       * The attendance register represents the complete
       * state for this session, so replacing its records
       * makes updates deterministic and avoids stale records.
       */

      await tx
        .delete(attendanceRecords)
        .where(
          eq(
            attendanceRecords.attendanceSessionId,
            sessionId,
          ),
        );

      /*
       * --------------------------------------------------------
       * INSERT ATTENDANCE RECORDS
       * --------------------------------------------------------
       */

      const recordsToInsert = Array.from(
        submittedStatuses.entries(),
      ).map(
        ([studentId, status]) => ({
          attendanceSessionId:
            sessionId,
          studentId,
          status,
        }),
      );

      if (recordsToInsert.length > 0) {
        await tx
          .insert(attendanceRecords)
          .values(recordsToInsert);
      }

      /*
       * --------------------------------------------------------
       * COMPLETE SESSION
       * --------------------------------------------------------
       */

      await tx
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
          ),
        );
    });
  } catch (error) {
    console.error(
      "Failed to save attendance:",
      error,
    );

    return {
      error:
        "Attendance could not be saved. Please try again.",
    };
  }

  /*
   * IMPORTANT:
   *
   * redirect() must remain outside the try/catch.
   * Next.js implements redirect by throwing internally.
   */

  redirect(
    `/attendance/take?streamId=${encodeURIComponent(
      streamId,
    )}&date=${encodeURIComponent(
      attendanceDate,
    )}`,
  );
}