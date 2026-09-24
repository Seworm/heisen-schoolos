import Link from "next/link";
import { and, asc, eq } from "drizzle-orm";

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

import AttendanceSessionActions from "./AttendanceSessionActions";

export const dynamic = "force-dynamic";

type AttendanceSessionPageProps = {
  params: Promise<{
    sessionID: string;
  }>;
};

export default async function AttendanceSessionPage({
  params,
}: AttendanceSessionPageProps) {
  const school = await requireCurrentSchool();
  const { sessionID } = await params;

  const [session] = await db
    .select({
      id: attendanceSessions.id,
      attendanceDate:
        attendanceSessions.attendanceDate,
      status: attendanceSessions.status,

      academicYearId:
        attendanceSessions.academicYearId,
      academicYearName:
        academicYears.name,

      termId: attendanceSessions.termId,
      termName: terms.name,

      streamId: attendanceSessions.streamId,
      streamName: streams.name,

      className: classLevels.name,
      classCategory: classLevels.category,
    })
    .from(attendanceSessions)
    .innerJoin(
      academicYears,
      eq(
        attendanceSessions.academicYearId,
        academicYears.id,
      ),
    )
    .innerJoin(
      terms,
      eq(
        attendanceSessions.termId,
        terms.id,
      ),
    )
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
          sessionID,
        ),
        eq(
          attendanceSessions.schoolId,
          school.id,
        ),
        eq(
          classLevels.schoolId,
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
            Session not found
          </h1>

          <p className="mt-2 text-sm text-red-800">
            The attendance session does not exist
            or does not belong to this school.
          </p>

          <Link
            href="/attendance"
            className="mt-6 inline-flex rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white"
          >
            Back to attendance
          </Link>
        </div>
      </div>
    );
  }

  const records = await db
    .select({
      id: attendanceRecords.id,
      studentId: attendanceRecords.studentId,
      studentNumber:
        students.studentNumber,
      firstName: students.firstName,
      middleName: students.middleName,
      lastName: students.lastName,
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

  const counts = records.reduce(
    (result, record) => {
      result[record.status] += 1;
      return result;
    },
    {
      present: 0,
      absent: 0,
      late: 0,
      excused: 0,
    },
  );

  const total = records.length;

  const attendanceRate =
    total > 0
      ? Math.round(
          ((counts.present +
            counts.late) /
            total) *
            100,
        )
      : 0;

  return (
    <div className="mx-auto max-w-6xl px-6 py-8 lg:px-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <Link
          href="/attendance"
          className="text-sm font-medium text-slate-500 transition hover:text-slate-900"
        >
          ← Back to attendance
        </Link>

        <span
          className={[
            "rounded-full px-3 py-1 text-xs font-semibold capitalize",
            session.status ===
            "completed"
              ? "bg-emerald-50 text-emerald-700"
              : session.status ===
                  "cancelled"
                ? "bg-red-50 text-red-700"
                : "bg-amber-50 text-amber-700",
          ].join(" ")}
        >
          {session.status}
        </span>
      </div>

      <div className="mb-8">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium capitalize text-slate-600">
            {session.classCategory}
          </span>

          <span className="text-sm text-slate-400">
            {session.academicYearName}
          </span>

          <span className="text-sm text-slate-400">
            {session.termName}
          </span>
        </div>

        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
          {session.className}{" "}
          {session.streamName}
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Attendance for{" "}
          {session.attendanceDate}
        </p>
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Recorded
          </p>
          <p className="mt-1 text-2xl font-semibold text-slate-950">
            {total}
          </p>
        </div>

        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-emerald-700">
            Present
          </p>
          <p className="mt-1 text-2xl font-semibold text-emerald-800">
            {counts.present}
          </p>
        </div>

        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-red-700">
            Absent
          </p>
          <p className="mt-1 text-2xl font-semibold text-red-800">
            {counts.absent}
          </p>
        </div>

        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-amber-700">
            Late
          </p>
          <p className="mt-1 text-2xl font-semibold text-amber-800">
            {counts.late}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Attendance rate
          </p>
          <p className="mt-1 text-2xl font-semibold text-slate-950">
            {attendanceRate}%
          </p>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <AttendanceSessionActions
            sessionId={session.id}
            status={session.status}
            streamId={session.streamId}
            attendanceDate={
              session.attendanceDate
            }
          />
          <a
            href={`/attendance/${session.id}/export`}
            className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Export CSV
          </a>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 bg-slate-50 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 md:grid md:grid-cols-[60px_minmax(0,1fr)_150px_minmax(160px,260px)] md:gap-4">
          <div>#</div>
          <div>Student</div>
          <div>Status</div>
          <div>Note</div>
        </div>

        <div className="divide-y divide-slate-100">
          {records.map(
            (record, index) => {
              const fullName = [
                record.firstName,
                record.middleName,
                record.lastName,
              ]
                .filter(Boolean)
                .join(" ");

              return (
                <div
                  key={record.id}
                  className="px-5 py-4 md:grid md:grid-cols-[60px_minmax(0,1fr)_150px_minmax(160px,260px)] md:items-center md:gap-4"
                >
                  <div className="text-sm text-slate-400">
                    {index + 1}
                  </div>

                  <div className="mt-2 md:mt-0">
                    <p className="font-medium text-slate-950">
                      {fullName}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {record.studentNumber}
                    </p>
                  </div>

                  <div className="mt-3 md:mt-0">
                    <span
                      className={[
                        "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize",
                        record.status ===
                        "present"
                          ? "bg-emerald-50 text-emerald-700"
                          : record.status ===
                              "absent"
                            ? "bg-red-50 text-red-700"
                            : record.status ===
                                "late"
                              ? "bg-amber-50 text-amber-700"
                              : "bg-slate-100 text-slate-700",
                      ].join(" ")}
                    >
                      {record.status}
                    </span>
                  </div>

                  <div className="mt-3 text-sm text-slate-500 md:mt-0">
                    {record.note || "—"}
                  </div>
                </div>
              );
            },
          )}
        </div>
      </div>
    </div>
  );
}
