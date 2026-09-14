import Link from "next/link";
import { and, asc, eq } from "drizzle-orm";

import { db } from "@/db";
import {
  attendanceRecords,
  attendanceSessions,
  classLevels,
  students,
  streams,
} from "@/db/schema";
import { requireCurrentSchool } from "@/lib/current-school";

export const dynamic = "force-dynamic";

type AttendanceSessionPageProps = {
  params: Promise<{
    sessionId: string;
  }>;
};

export default async function AttendanceSessionPage({
  params,
}: AttendanceSessionPageProps) {
  const school = await requireCurrentSchool();

  const { sessionId } = await params;

  const [session] = await db
    .select({
      id: attendanceSessions.id,
      attendanceDate:
        attendanceSessions.attendanceDate,
      status: attendanceSessions.status,
      className: classLevels.name,
      classCategory: classLevels.category,
      streamName: streams.name,
    })
    .from(attendanceSessions)
    .innerJoin(
      streams,
      eq(
        attendanceSessions.streamId,
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
    return (
      <div className="mx-auto max-w-4xl px-6 py-10 lg:px-8">
        <div className="rounded-xl border border-red-200 bg-red-50 p-8">
          <p className="text-sm font-medium text-red-700">
            Attendance
          </p>

          <h1 className="mt-1 text-2xl font-semibold text-red-950">
            Attendance session not found
          </h1>

          <p className="mt-2 text-sm text-red-800">
            The requested attendance session does not exist or does
            not belong to this school.
          </p>

          <Link
            href="/attendance"
            className="mt-6 inline-flex rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Back to attendance
          </Link>
        </div>
      </div>
    );
  }

  const records = await db
    .select({
      studentId: students.id,
      studentNumber: students.studentNumber,
      firstName: students.firstName,
      middleName: students.middleName,
      lastName: students.lastName,
      gender: students.gender,
      status: attendanceRecords.status,
      note: attendanceRecords.note,
    })
    .from(attendanceRecords)
    .innerJoin(
      students,
      eq(
        attendanceRecords.studentId,
        students.id,
      ),
    )
    .where(
      eq(
        attendanceRecords.attendanceSessionId,
        session.id,
      ),
    )
    .orderBy(
      asc(students.lastName),
      asc(students.firstName),
      asc(students.studentNumber),
    );

  const presentCount = records.filter(
    (record) => record.status === "present",
  ).length;

  const absentCount = records.filter(
    (record) => record.status === "absent",
  ).length;

  const lateCount = records.filter(
    (record) => record.status === "late",
  ).length;

  const excusedCount = records.filter(
    (record) => record.status === "excused",
  ).length;

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
              {session.classCategory}
            </span>

            <span
              className={
                session.status === "completed"
                  ? "rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700"
                  : session.status === "open"
                    ? "rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700"
                    : "rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500"
              }
            >
              {session.status}
            </span>
          </div>

          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
            {session.className} {session.streamName}
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Attendance for {session.attendanceDate}
          </p>
        </div>

        <Link
          href={`/attendance/take?streamId=${session.id}`}
          className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
        >
          Open register
        </Link>
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Students
          </p>

          <p className="mt-1 text-2xl font-semibold text-slate-950">
            {records.length}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Present
          </p>

          <p className="mt-1 text-2xl font-semibold text-emerald-700">
            {presentCount}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Absent
          </p>

          <p className="mt-1 text-2xl font-semibold text-red-700">
            {absentCount}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Late / Excused
          </p>

          <p className="mt-1 text-2xl font-semibold text-amber-700">
            {lateCount + excusedCount}
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">
          <h2 className="text-sm font-semibold text-slate-950">
            Attendance register
          </h2>

          <p className="mt-1 text-xs text-slate-500">
            Recorded attendance for this session.
          </p>
        </div>

        {records.length === 0 ? (
          <div className="p-10 text-center">
            <h3 className="font-semibold text-slate-950">
              No attendance records
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              This session does not contain any student attendance
              records.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {records.map((record, index) => {
              const fullName = [
                record.firstName,
                record.middleName,
                record.lastName,
              ]
                .filter(Boolean)
                .join(" ");

              return (
                <div
                  key={record.studentId}
                  className="grid gap-3 px-5 py-4 sm:grid-cols-[60px_minmax(0,1fr)_120px] sm:items-center"
                >
                  <div className="text-sm text-slate-400">
                    {index + 1}
                  </div>

                  <div>
                    <p className="font-medium text-slate-950">
                      {fullName}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {record.studentNumber}
                    </p>
                  </div>

                  <div>
                    <span
                      className={
                        record.status === "present"
                          ? "inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700"
                          : record.status === "absent"
                            ? "inline-flex rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700"
                            : record.status === "late"
                              ? "inline-flex rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700"
                              : "inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600"
                      }
                    >
                      {record.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}