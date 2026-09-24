import { and, asc, eq } from "drizzle-orm";
import { NextRequest } from "next/server";

import { db } from "@/db";
import {
  academicYears,
  attendanceRecords,
  attendanceSessions,
  classLevels,
  streams,
  students,
  terms,
} from "@/db/schema";
import { requireCurrentSchool } from "@/lib/current-school";

function csvCell(value: unknown) {
  const text = value == null ? "" : String(value);
  return `"${text.replaceAll('"', '""')}"`;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ sessionID: string }> },
) {
  const school = await requireCurrentSchool();
  const { sessionID } = await params;
  const [session] = await db
    .select({
      attendanceDate: attendanceSessions.attendanceDate,
      className: classLevels.name,
      streamName: streams.name,
      academicYearName: academicYears.name,
      termName: terms.name,
    })
    .from(attendanceSessions)
    .innerJoin(academicYears, eq(academicYears.id, attendanceSessions.academicYearId))
    .innerJoin(terms, eq(terms.id, attendanceSessions.termId))
    .innerJoin(streams, eq(streams.id, attendanceSessions.streamId))
    .innerJoin(classLevels, eq(classLevels.id, streams.classLevelId))
    .where(and(
      eq(attendanceSessions.id, sessionID),
      eq(attendanceSessions.schoolId, school.id),
      eq(classLevels.schoolId, school.id),
    ))
    .limit(1);

  if (!session) {
    return new Response("Attendance session not found.", { status: 404 });
  }

  const records = await db
    .select({
      studentNumber: students.studentNumber,
      firstName: students.firstName,
      middleName: students.middleName,
      lastName: students.lastName,
      status: attendanceRecords.status,
      note: attendanceRecords.note,
    })
    .from(attendanceRecords)
    .innerJoin(students, eq(students.id, attendanceRecords.studentId))
    .where(eq(attendanceRecords.attendanceSessionId, sessionID))
    .orderBy(asc(students.lastName), asc(students.firstName), asc(students.studentNumber));

  const header = [
    "Attendance date",
    "Academic year",
    "Term",
    "Class",
    "Stream",
    "Student number",
    "Student name",
    "Status",
    "Note",
  ];
  const rows = records.map((record) => [
    session.attendanceDate,
    session.academicYearName,
    session.termName,
    session.className,
    session.streamName,
    record.studentNumber,
    [record.firstName, record.middleName, record.lastName].filter(Boolean).join(" "),
    record.status,
    record.note,
  ]);
  const csv = [header, ...rows]
    .map((row) => row.map(csvCell).join(","))
    .join("\r\n");
  const filename = `attendance-${session.attendanceDate}-${session.streamName.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "")}.csv`;

  return new Response(`\uFEFF${csv}\r\n`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
