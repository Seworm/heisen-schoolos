import { and, asc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { classLevels, classrooms, staff, streams, subjects, timetableEntries, timetablePeriods } from "@/db/schema";
import { requireRole } from "@/lib/authorization";
import { getCurrentSchool } from "@/lib/current-school";

export async function GET(request: Request) {
  const school = await getCurrentSchool();
  await requireRole(["super_admin", "platform_admin", "school_owner", "school_admin", "principal", "headteacher", "teacher"]);
  const params = new URL(request.url).searchParams;
  const year = params.get("year");
  const term = params.get("term");
  const classId = params.get("classId");
  const teacherId = params.get("teacherId");
  if (!year || !term) return NextResponse.json({ error: "Academic year and term are required." }, { status: 400 });
  const rows = await db.select({
    day: timetablePeriods.dayOfWeek, period: timetablePeriods.name, startsAt: timetablePeriods.startsAt, endsAt: timetablePeriods.endsAt,
    className: streams.name, subject: subjects.name, teacher: staff.firstName, teacherLast: staff.lastName, classroom: classrooms.name,
  }).from(timetableEntries).innerJoin(timetablePeriods, eq(timetablePeriods.id, timetableEntries.periodId))
    .innerJoin(streams, eq(streams.id, timetableEntries.streamId)).innerJoin(classLevels, eq(classLevels.id, streams.classLevelId)).innerJoin(subjects, eq(subjects.id, timetableEntries.subjectId))
    .innerJoin(staff, eq(staff.id, timetableEntries.staffId)).leftJoin(classrooms, eq(classrooms.id, timetableEntries.classroomId))
    .where(and(eq(timetableEntries.schoolId, school.id), eq(classLevels.schoolId, school.id), eq(subjects.schoolId, school.id), eq(staff.schoolId, school.id), eq(timetableEntries.academicYearId, year), eq(timetableEntries.termId, term), ...(classId ? [eq(timetableEntries.streamId, classId)] : []), ...(teacherId ? [eq(timetableEntries.staffId, teacherId)] : [])))
    .orderBy(asc(timetablePeriods.dayOfWeek), asc(timetablePeriods.sortOrder));
  const escape = (value: string | number | null) => `"${String(value ?? "").replaceAll('"', '""')}"`;
  const csv = ["Day,Period,Starts,Ends,Class,Subject,Teacher,Room", ...rows.map((row) => [row.day, row.period, row.startsAt, row.endsAt, row.className, row.subject, `${row.teacher} ${row.teacherLast}`, row.classroom].map(escape).join(","))].join("\r\n");
  return new NextResponse(csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="timetable-${year}-${term}.csv"` } });
}
