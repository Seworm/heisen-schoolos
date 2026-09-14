import Link from "next/link";
import { and, asc, eq } from "drizzle-orm";

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
import { getGhanaDate } from "@/lib/dates";

import AttendanceRegister from "./AttendanceRegister";

export const dynamic = "force-dynamic";

type AttendanceTakePageProps = {
  searchParams: Promise<{
    streamId?: string;
    date?: string;
  }>;
};

function isValidDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export default async function AttendanceTakePage({
  searchParams,
}: AttendanceTakePageProps) {
  const school = await requireCurrentSchool();

  const params = await searchParams;

  const streamId = params.streamId;
  const requestedDate = params.date;

  if (!streamId) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-10 lg:px-8">
        <div className="rounded-xl border border-slate-200 bg-white p-8">
          <p className="text-sm font-medium text-slate-500">
            Attendance
          </p>

          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
            Select a stream
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Choose a class and stream before taking attendance.
          </p>

          <Link
            href="/attendance"
            className="mt-6 inline-flex rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Back to attendance
          </Link>
        </div>
      </div>
    );
  }

  const attendanceDate =
    requestedDate && isValidDate(requestedDate)
      ? requestedDate
      : getGhanaDate();

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
    return (
      <div className="mx-auto max-w-4xl px-6 py-10 lg:px-8">
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-8">
          <p className="text-sm font-medium text-amber-700">
            Attendance
          </p>

          <h1 className="mt-1 text-2xl font-semibold text-amber-950">
            No current academic year
          </h1>

          <p className="mt-2 text-sm text-amber-800">
            Set an academic year as current before taking attendance.
          </p>

          <Link
            href="/academics/years"
            className="mt-6 inline-flex rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Manage academic years
          </Link>
        </div>
      </div>
    );
  }

  const [term] = await db
    .select()
    .from(terms)
    .where(
      and(
        eq(terms.academicYearId, academicYear.id),
        eq(terms.isCurrent, true),
      ),
    )
    .limit(1);

  if (!term) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-10 lg:px-8">
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-8">
          <p className="text-sm font-medium text-amber-700">
            Attendance
          </p>

          <h1 className="mt-1 text-2xl font-semibold text-amber-950">
            No current term
          </h1>

          <p className="mt-2 text-sm text-amber-800">
            Set a term as current for the active academic year before
            taking attendance.
          </p>

          <Link
            href={`/academics/years/${academicYear.id}`}
            className="mt-6 inline-flex rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Manage terms
          </Link>
        </div>
      </div>
    );
  }

  const [streamResult] = await db
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
      eq(streams.classLevelId, classLevels.id),
    )
    .where(
      and(
        eq(streams.id, streamId),
        eq(classLevels.schoolId, school.id),
      ),
    )
    .limit(1);

  if (!streamResult) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-10 lg:px-8">
        <div className="rounded-xl border border-red-200 bg-red-50 p-8">
          <p className="text-sm font-medium text-red-700">
            Attendance
          </p>

          <h1 className="mt-1 text-2xl font-semibold text-red-950">
            Stream not found
          </h1>

          <p className="mt-2 text-sm text-red-800">
            The selected stream does not belong to this school or no
            longer exists.
          </p>

          <Link
            href="/attendance"
            className="mt-6 inline-flex rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Back to attendance
          </Link>
        </div>
      </div>
    );
  }

  const studentRows = await db
    .select({
      id: students.id,
      studentNumber: students.studentNumber,
      firstName: students.firstName,
      middleName: students.middleName,
      lastName: students.lastName,
      gender: students.gender,
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
      eq(studentEnrollments.studentId, students.id),
    )
    .where(
      and(
        eq(studentPlacements.streamId, streamId),
        eq(studentPlacements.status, "active"),
        eq(
          studentEnrollments.academicYearId,
          academicYear.id,
        ),
        eq(studentEnrollments.status, "active"),
        eq(students.schoolId, school.id),
      ),
    )
    .orderBy(
      asc(students.lastName),
      asc(students.firstName),
      asc(students.studentNumber),
    );

  const [session] = await db
    .select()
    .from(attendanceSessions)
    .where(
      and(
        eq(attendanceSessions.id, attendanceSessions.id),
        eq(attendanceSessions.schoolId, school.id),
        eq(attendanceSessions.streamId, streamId),
        eq(
          attendanceSessions.attendanceDate,
          attendanceDate,
        ),
      ),
    )
    .limit(1);

  let records: {
    studentId: string;
    status:
      | "present"
      | "absent"
      | "late"
      | "excused";
    note: string | null;
  }[] = [];

  if (session) {
    records = await db
      .select({
        studentId: attendanceRecords.studentId,
        status: attendanceRecords.status,
        note: attendanceRecords.note,
      })
      .from(attendanceRecords)
      .where(
        eq(
          attendanceRecords.attendanceSessionId,
          session.id,
        ),
      );
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-8 lg:px-8">
      <div className="mb-6">
        <Link
          href="/attendance"
          className="text-sm font-medium text-slate-500 transition hover:text-slate-900"
        >
          ← Back to attendance
        </Link>
      </div>

      <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium capitalize text-slate-600">
              {streamResult.classCategory}
            </span>

            <span className="text-sm text-slate-400">
              {academicYear.name}
            </span>

            <span className="text-sm text-slate-400">
              {term.name}
            </span>
          </div>

          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
            {streamResult.className} {streamResult.name}
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Daily attendance register
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white px-5 py-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Attendance date
          </p>

          <p className="mt-1 text-sm font-semibold text-slate-900">
            {attendanceDate}
          </p>
        </div>
      </div>

      <AttendanceRegister
        streamId={streamId}
        attendanceDate={attendanceDate}
        streamName={`${streamResult.className} ${streamResult.name}`}
        academicYearName={academicYear.name}
        termName={term.name}
        students={studentRows}
        records={records}
        sessionStatus={session?.status ?? null}
      />
    </div>
  );
}
