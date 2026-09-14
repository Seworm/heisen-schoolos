"use client";

import { useActionState, useMemo, useState } from "react";

import { saveAttendance } from "./actions";

type Student = {
  id: string;
  studentNumber: string;
  firstName: string;
  middleName: string | null;
  lastName: string;
  gender: "male" | "female";
};

type AttendanceStatus =
  | "present"
  | "absent"
  | "late"
  | "excused";

type AttendanceRecord = {
  studentId: string;
  status: AttendanceStatus;
  note: string | null;
};

type AttendanceRegisterProps = {
  streamId: string;
  attendanceDate: string;
  streamName: string;
  academicYearName: string;
  termName: string;
  students: Student[];
  records: AttendanceRecord[];
  sessionStatus:
    | "open"
    | "completed"
    | "cancelled"
    | null;
};

type ActionState = {
  error?: string;
};

const initialState: ActionState = {};

export default function AttendanceRegister({
  streamId,
  attendanceDate,
  streamName,
  academicYearName,
  termName,
  students,
  records,
  sessionStatus,
}: AttendanceRegisterProps) {
  const [state, formAction, pending] = useActionState(
    saveAttendance,
    initialState,
  );

  const existingRecords = useMemo(() => {
    return new Map(
      records.map((record) => [
        record.studentId,
        record,
      ]),
    );
  }, [records]);

  const initialStatuses = useMemo(() => {
    const result: Record<string, AttendanceStatus> = {};

    for (const student of students) {
      const existing = existingRecords.get(student.id);

      result[student.id] =
        existing?.status ?? "present";
    }

    return result;
  }, [students, existingRecords]);

  const [statuses, setStatuses] =
    useState<Record<string, AttendanceStatus>>(
      initialStatuses,
    );

  const presentCount = Object.values(statuses).filter(
    (status) => status === "present",
  ).length;

  const absentCount = Object.values(statuses).filter(
    (status) => status === "absent",
  ).length;

  const lateCount = Object.values(statuses).filter(
    (status) => status === "late",
  ).length;

  const excusedCount = Object.values(statuses).filter(
    (status) => status === "excused",
  ).length;

  function setAllStatus(
    status: AttendanceStatus,
  ) {
    const next: Record<string, AttendanceStatus> = {};

    for (const student of students) {
      next[student.id] = status;
    }

    setStatuses(next);
  }

  function setStudentStatus(
    studentId: string,
    status: AttendanceStatus,
  ) {
    setStatuses((current) => ({
      ...current,
      [studentId]: status,
    }));
  }

  return (
    <form action={formAction}>
      <input
        type="hidden"
        name="streamId"
        value={streamId}
      />

      <input
        type="hidden"
        name="attendanceDate"
        value={attendanceDate}
      />

      <input
        type="hidden"
        name="academicYearName"
        value={academicYearName}
      />

      <input
        type="hidden"
        name="termName"
        value={termName}
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Students
          </p>

          <p className="mt-1 text-2xl font-semibold text-slate-950">
            {students.length}
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

      <div className="mb-4 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-950">
            {streamName}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            {attendanceDate}
            {sessionStatus
              ? ` • Session ${sessionStatus}`
              : " • New session"}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setAllStatus("present")}
            className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
          >
            Mark all present
          </button>

          <button
            type="button"
            onClick={() => setAllStatus("absent")}
            className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100"
          >
            Mark all absent
          </button>
        </div>
      </div>

      {state.error ? (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {state.error}
        </div>
      ) : null}

      {students.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-10 text-center">
          <h2 className="font-semibold text-slate-950">
            No active students
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            There are currently no active students placed in this
            stream for the current academic year.
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="hidden border-b border-slate-200 bg-slate-50 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 md:grid md:grid-cols-[80px_minmax(0,1fr)_140px]">
              <div>#</div>
              <div>Student</div>
              <div>Status</div>
            </div>

            <div className="divide-y divide-slate-100">
              {students.map((student, index) => {
                const fullName = [
                  student.firstName,
                  student.middleName,
                  student.lastName,
                ]
                  .filter(Boolean)
                  .join(" ");

                const currentStatus =
                  statuses[student.id] ??
                  "present";

                return (
                  <div
                    key={student.id}
                    className="px-5 py-4 md:grid md:grid-cols-[80px_minmax(0,1fr)_140px] md:items-center md:gap-4"
                  >
                    <div className="text-sm text-slate-400">
                      {index + 1}
                    </div>

                    <div className="mt-2 min-w-0 md:mt-0">
                      <p className="font-medium text-slate-950">
                        {fullName}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {student.studentNumber}
                      </p>
                    </div>

                    <div className="mt-3 md:mt-0">
                      <select
                        name={`status_${student.id}`}
                        value={currentStatus}
                        onChange={(event) =>
                          setStudentStatus(
                            student.id,
                            event.target
                              .value as AttendanceStatus,
                          )
                        }
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                      >
                        <option value="present">
                          Present
                        </option>

                        <option value="absent">
                          Absent
                        </option>

                        <option value="late">
                          Late
                        </option>

                        <option value="excused">
                          Excused
                        </option>
                      </select>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-950">
                Ready to save attendance
              </p>

              <p className="mt-1 text-xs text-slate-500">
                {presentCount} present · {absentCount} absent ·{" "}
                {lateCount} late · {excusedCount} excused
              </p>
            </div>

            <button
              type="submit"
              disabled={pending}
              className="inline-flex items-center justify-center rounded-lg bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {pending
                ? "Saving attendance..."
                : sessionStatus === "completed"
                  ? "Update attendance"
                  : "Save attendance"}
            </button>
          </div>
        </>
      )}
    </form>
  );
}