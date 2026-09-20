"use client";

import {
  useActionState,
  useMemo,
  useState,
} from "react";

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

const STATUS_OPTIONS: {
  value: AttendanceStatus;
  label: string;
}[] = [
  {
    value: "present",
    label: "Present",
  },
  {
    value: "absent",
    label: "Absent",
  },
  {
    value: "late",
    label: "Late",
  },
  {
    value: "excused",
    label: "Excused",
  },
];

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
  const [state, formAction, pending] =
    useActionState(
      saveAttendance,
      initialState,
    );

  const existingRecords = useMemo(
    () =>
      new Map(
        records.map((record) => [
          record.studentId,
          record,
        ]),
      ),
    [records],
  );

  const initialStatuses = useMemo(() => {
    const result: Record<
      string,
      AttendanceStatus
    > = {};

    for (const student of students) {
      result[student.id] =
        existingRecords.get(student.id)
          ?.status ?? "present";
    }

    return result;
  }, [students, existingRecords]);

  const initialNotes = useMemo(() => {
    const result: Record<
      string,
      string
    > = {};

    for (const student of students) {
      result[student.id] =
        existingRecords.get(student.id)
          ?.note ?? "";
    }

    return result;
  }, [students, existingRecords]);

  const [statuses, setStatuses] =
    useState<
      Record<string, AttendanceStatus>
    >(initialStatuses);

  const [notes, setNotes] =
    useState<Record<string, string>>(
      initialNotes,
    );

  const isReadOnly =
    sessionStatus === "completed" ||
    sessionStatus === "cancelled";

  const presentCount = Object.values(
    statuses,
  ).filter(
    (status) => status === "present",
  ).length;

  const absentCount = Object.values(
    statuses,
  ).filter(
    (status) => status === "absent",
  ).length;

  const lateCount = Object.values(
    statuses,
  ).filter(
    (status) => status === "late",
  ).length;

  const excusedCount = Object.values(
    statuses,
  ).filter(
    (status) => status === "excused",
  ).length;

  function setAllStatus(
    status: AttendanceStatus,
  ) {
    const next: Record<
      string,
      AttendanceStatus
    > = {};

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

  function setStudentNote(
    studentId: string,
    note: string,
  ) {
    setNotes((current) => ({
      ...current,
      [studentId]: note,
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

      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Students
          </p>
          <p className="mt-1 text-2xl font-semibold text-slate-950">
            {students.length}
          </p>
        </div>

        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-emerald-700">
            Present
          </p>
          <p className="mt-1 text-2xl font-semibold text-emerald-800">
            {presentCount}
          </p>
        </div>

        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-red-700">
            Absent
          </p>
          <p className="mt-1 text-2xl font-semibold text-red-800">
            {absentCount}
          </p>
        </div>

        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-amber-700">
            Late
          </p>
          <p className="mt-1 text-2xl font-semibold text-amber-800">
            {lateCount}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Excused
          </p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">
            {excusedCount}
          </p>
        </div>
      </div>

      <div className="mb-4 flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-950">
            {streamName}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            {academicYearName} · {termName} ·{" "}
            {attendanceDate}
          </p>
        </div>

        {!isReadOnly ? (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() =>
                setAllStatus("present")
              }
              className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
            >
              Mark all present
            </button>

            <button
              type="button"
              onClick={() =>
                setAllStatus("absent")
              }
              className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100"
            >
              Mark all absent
            </button>
          </div>
        ) : null}
      </div>

      {sessionStatus === "completed" ? (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          This attendance session has been
          completed and is read-only.
        </div>
      ) : null}

      {sessionStatus === "cancelled" ? (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          This attendance session has been
          cancelled and is read-only.
        </div>
      ) : null}

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
            There are currently no active students
            placed in this stream for the current
            academic year.
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="hidden border-b border-slate-200 bg-slate-50 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 md:grid md:grid-cols-[60px_minmax(0,1fr)_170px_minmax(180px,260px)] md:gap-4">
              <div>#</div>
              <div>Student</div>
              <div>Status</div>
              <div>Note</div>
            </div>

            <div className="divide-y divide-slate-100">
              {students.map(
                (student, index) => {
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
                      className="px-5 py-4 md:grid md:grid-cols-[60px_minmax(0,1fr)_170px_minmax(180px,260px)] md:items-center md:gap-4"
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
                          disabled={isReadOnly}
                          onChange={(event) =>
                            setStudentStatus(
                              student.id,
                              event.target
                                .value as AttendanceStatus,
                            )
                          }
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500"
                        >
                          {STATUS_OPTIONS.map(
                            (option) => (
                              <option
                                key={
                                  option.value
                                }
                                value={
                                  option.value
                                }
                              >
                                {option.label}
                              </option>
                            ),
                          )}
                        </select>
                      </div>

                      <div className="mt-3 md:mt-0">
                        <input
                          type="text"
                          name={`note_${student.id}`}
                          value={
                            notes[
                              student.id
                            ] ?? ""
                          }
                          disabled={isReadOnly}
                          maxLength={500}
                          placeholder="Optional note"
                          onChange={(event) =>
                            setStudentNote(
                              student.id,
                              event.target
                                .value,
                            )
                          }
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100 disabled:cursor-not-allowed disabled:bg-slate-50"
                        />
                      </div>
                    </div>
                  );
                },
              )}
            </div>
          </div>

          {!isReadOnly ? (
            <div className="mt-5 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-950">
                  Save attendance
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  {presentCount} present ·{" "}
                  {absentCount} absent ·{" "}
                  {lateCount} late ·{" "}
                  {excusedCount} excused
                </p>
              </div>

              <button
                type="submit"
                disabled={pending}
                className="inline-flex items-center justify-center rounded-lg bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {pending
                  ? "Saving..."
                  : "Save attendance"}
              </button>
            </div>
          ) : null}
        </>
      )}
    </form>
  );
}