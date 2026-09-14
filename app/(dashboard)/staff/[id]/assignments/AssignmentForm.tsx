"use client";

import { useActionState } from "react";
import Link from "next/link";

import { createTeacherAssignment } from "./actions";

type AcademicYear = {
  id: string;
  name: string;
  isCurrent: boolean;
};

type Stream = {
  id: string;
  name: string;
  className: string;
  classLevelId: string;
  sortOrder: number;
};

type Subject = {
  id: string;
  name: string;
  code: string | null;
};

type FormState = {
  error?: string;
};

type AssignmentFormProps = {
  staffId: string;
  academicYears: AcademicYear[];
  streams: Stream[];
  subjects: Subject[];
};

const initialState: FormState = {};

export default function AssignmentForm({
  staffId,
  academicYears,
  streams,
  subjects,
}: AssignmentFormProps) {
  const createAssignmentWithStaff = createTeacherAssignment.bind(
    null,
    staffId,
  );

  const [state, formAction, pending] = useActionState(
    createAssignmentWithStaff,
    initialState,
  );

  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-6 py-5">
        <h2 className="text-base font-semibold text-slate-950">
          Add assignment
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Assign this staff member to a class or subject.
        </p>
      </div>

      <form action={formAction} className="space-y-5 px-6 py-6">
        {state.error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-5 text-red-700">
            {state.error}
          </div>
        )}

        <div>
          <label
            htmlFor="academicYearId"
            className="block text-sm font-medium text-slate-700"
          >
            Academic year
          </label>

          <select
            id="academicYearId"
            name="academicYearId"
            required
            defaultValue={
              academicYears.find((year) => year.isCurrent)?.id ??
              ""
            }
            className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-200"
          >
            <option value="">Select academic year</option>

            {academicYears.map((year) => (
              <option key={year.id} value={year.id}>
                {year.name}
                {year.isCurrent ? " (Current)" : ""}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="streamId"
            className="block text-sm font-medium text-slate-700"
          >
            Class / stream
          </label>

          <select
            id="streamId"
            name="streamId"
            required
            defaultValue=""
            className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-200"
          >
            <option value="">Select class</option>

            {streams.map((stream) => (
              <option key={stream.id} value={stream.id}>
                {stream.className} {stream.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="subjectId"
            className="block text-sm font-medium text-slate-700"
          >
            Subject
          </label>

          <select
            id="subjectId"
            name="subjectId"
            defaultValue=""
            className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-200"
          >
            <option value="">
              No subject / class teacher only
            </option>

            {subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.name}
                {subject.code ? ` (${subject.code})` : ""}
              </option>
            ))}
          </select>
        </div>

        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <input
            type="checkbox"
            name="isClassTeacher"
            value="true"
            className="mt-0.5 h-4 w-4 rounded border-slate-300"
          />

          <span>
            <span className="block text-sm font-medium text-slate-900">
              Class teacher
            </span>

            <span className="mt-1 block text-xs leading-5 text-slate-500">
              Mark this staff member as the class teacher for the
              selected stream.
            </span>
          </span>
        </label>

        <div className="border-t border-slate-100 pt-5">
          <button
            type="submit"
            disabled={pending}
            className="inline-flex w-full items-center justify-center rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending
              ? "Adding assignment..."
              : "Add assignment"}
          </button>

          <Link
            href={`/staff/${staffId}`}
            className="mt-3 inline-flex w-full items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            Back to profile
          </Link>
        </div>
      </form>
    </section>
  );
}