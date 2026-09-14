"use client";

import Link from "next/link";
import { useActionState } from "react";

import { addClassSubject } from "./actions";

type Subject = {
  id: string;
  name: string;
  code: string | null;
};

type Props = {
  classId: string;
  className: string;
  subjects: Subject[];
};

type FormState = {
  error?: string;
};

const initialState: FormState = {};

export default function CurriculumSubjectForm({
  classId,
  className,
  subjects,
}: Props) {
  const [state, formAction, pending] = useActionState(
    addClassSubject,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-6">
      <input
        type="hidden"
        name="classId"
        value={classId}
      />

      {state.error ? (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {state.error}
        </div>
      ) : null}

      <div>
        <label
          htmlFor="subjectId"
          className="block text-sm font-medium text-slate-900"
        >
          Subject
        </label>

        <select
          id="subjectId"
          name="subjectId"
          required
          disabled={pending}
          className="mt-2 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-100"
        >
          <option value="">
            Select a subject
          </option>

          {subjects.map((subject) => (
            <option
              key={subject.id}
              value={subject.id}
            >
              {subject.name}
              {subject.code
                ? ` (${subject.code})`
                : ""}
            </option>
          ))}
        </select>

        <p className="mt-2 text-xs text-slate-500">
          Only subjects belonging to this school are available.
        </p>
      </div>

      <div className="rounded-lg bg-slate-50 px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          Curriculum
        </p>

        <p className="mt-1 font-medium text-slate-900">
          {className}
        </p>

        <p className="mt-1 text-sm text-slate-500">
          The subject will be available for this class across
          its streams.
        </p>
      </div>

      <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:justify-end">
        <Link
          href={`/academics/classes/${classId}/subjects`}
          className="inline-flex items-center justify-center rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Cancel
        </Link>

        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center justify-center rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Adding..." : "Add subject"}
        </button>
      </div>
    </form>
  );
}