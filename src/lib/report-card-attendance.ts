import { and, eq, inArray } from "drizzle-orm";

import { db } from "@/db";
import {
  attendanceRecords,
  attendanceSessions,
} from "@/db/schema";

export type ReportCardAttendance = {
  schoolDays: number;
  present: number;
  late: number;
  absent: number;
  excused: number;
  attendancePercentage: number;
};

function roundToTwoDecimals(
  value: number,
): number {
  return Math.round(value * 100) / 100;
}

/**
 * Calculate report-card attendance for one student.
 *
 * Rules:
 *
 * - completed sessions are official school days
 * - cancelled/open sessions are excluded
 * - present + late = attended
 * - excused is displayed separately
 * - excused days are excluded from denominator
 * - missing attendance record = absent
 */
export async function getReportCardAttendance(
  params: {
    schoolId: string;
    academicYearId: string;
    termId: string;
    streamId: string;
    studentId: string;
  },
): Promise<ReportCardAttendance> {
  const {
    schoolId,
    academicYearId,
    termId,
    streamId,
    studentId,
  } = params;

  const sessions = await db
    .select({
      id: attendanceSessions.id,
    })
    .from(attendanceSessions)
    .where(
      and(
        eq(
          attendanceSessions.schoolId,
          schoolId,
        ),
        eq(
          attendanceSessions.academicYearId,
          academicYearId,
        ),
        eq(
          attendanceSessions.termId,
          termId,
        ),
        eq(
          attendanceSessions.streamId,
          streamId,
        ),
        eq(
          attendanceSessions.status,
          "completed",
        ),
      ),
    );

  if (sessions.length === 0) {
    return {
      schoolDays: 0,
      present: 0,
      late: 0,
      absent: 0,
      excused: 0,
      attendancePercentage: 0,
    };
  }

  const sessionIds = sessions.map(
    (session) => session.id,
  );

  const records = await db
    .select({
      attendanceSessionId:
        attendanceRecords.attendanceSessionId,
      status:
        attendanceRecords.status,
    })
    .from(attendanceRecords)
    .where(
      and(
        inArray(
          attendanceRecords.attendanceSessionId,
          sessionIds,
        ),
        eq(
          attendanceRecords.studentId,
          studentId,
        ),
      ),
    );

  const attendanceBySession = new Map(
    records.map((record) => [
      record.attendanceSessionId,
      record.status,
    ]),
  );

  let present = 0;
  let late = 0;
  let absent = 0;
  let excused = 0;

  for (const session of sessions) {
    const status =
      attendanceBySession.get(
        session.id,
      );

    switch (status) {
      case "present":
        present += 1;
        break;

      case "late":
        late += 1;
        break;

      case "excused":
        excused += 1;
        break;

      case "absent":
      default:
        absent += 1;
        break;
    }
  }

  const schoolDays = sessions.length;

  const denominator = Math.max(
    0,
    schoolDays - excused,
  );

  const attendancePercentage =
    denominator > 0
      ? roundToTwoDecimals(
          ((present + late) /
            denominator) *
            100,
        )
      : 0;

  return {
    schoolDays,
    present,
    late,
    absent,
    excused,
    attendancePercentage,
  };
}

/**
 * Batch attendance calculation.
 *
 * Used by the "Print All Approved" route so we do not
 * execute one attendance query per report card.
 */
export async function getReportCardAttendanceForStudents(
  params: {
    schoolId: string;
    academicYearId: string;
    termId: string;
    streamId: string;
    studentIds: string[];
  },
): Promise<Map<string, ReportCardAttendance>> {
  const {
    schoolId,
    academicYearId,
    termId,
    streamId,
    studentIds,
  } = params;

  const result = new Map<
    string,
    ReportCardAttendance
  >();

  for (const studentId of studentIds) {
    result.set(studentId, {
      schoolDays: 0,
      present: 0,
      late: 0,
      absent: 0,
      excused: 0,
      attendancePercentage: 0,
    });
  }

  if (studentIds.length === 0) {
    return result;
  }

  const sessions = await db
    .select({
      id: attendanceSessions.id,
    })
    .from(attendanceSessions)
    .where(
      and(
        eq(
          attendanceSessions.schoolId,
          schoolId,
        ),
        eq(
          attendanceSessions.academicYearId,
          academicYearId,
        ),
        eq(
          attendanceSessions.termId,
          termId,
        ),
        eq(
          attendanceSessions.streamId,
          streamId,
        ),
        eq(
          attendanceSessions.status,
          "completed",
        ),
      ),
    );

  if (sessions.length === 0) {
    return result;
  }

  const sessionIds = sessions.map(
    (session) => session.id,
  );

  const records = await db
    .select({
      studentId:
        attendanceRecords.studentId,
      attendanceSessionId:
        attendanceRecords.attendanceSessionId,
      status:
        attendanceRecords.status,
    })
    .from(attendanceRecords)
    .where(
      and(
        inArray(
          attendanceRecords.attendanceSessionId,
          sessionIds,
        ),
        inArray(
          attendanceRecords.studentId,
          studentIds,
        ),
      ),
    );

  const recordsByStudent =
    new Map<
      string,
      Map<string, string>
    >();

  for (const record of records) {
    const studentRecords =
      recordsByStudent.get(
        record.studentId,
      ) ?? new Map<string, string>();

    studentRecords.set(
      record.attendanceSessionId,
      record.status,
    );

    recordsByStudent.set(
      record.studentId,
      studentRecords,
    );
  }

  const schoolDays = sessions.length;

  for (const studentId of studentIds) {
    const studentRecords =
      recordsByStudent.get(
        studentId,
      ) ?? new Map<string, string>();

    let present = 0;
    let late = 0;
    let absent = 0;
    let excused = 0;

    for (const session of sessions) {
      const status =
        studentRecords.get(
          session.id,
        );

      switch (status) {
        case "present":
          present += 1;
          break;

        case "late":
          late += 1;
          break;

        case "excused":
          excused += 1;
          break;

        case "absent":
        default:
          absent += 1;
          break;
      }
    }

    const denominator = Math.max(
      0,
      schoolDays - excused,
    );

    const attendancePercentage =
      denominator > 0
        ? roundToTwoDecimals(
            ((present + late) /
              denominator) *
              100,
          )
        : 0;

    result.set(studentId, {
      schoolDays,
      present,
      late,
      absent,
      excused,
      attendancePercentage,
    });
  }

  return result;
}