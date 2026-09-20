"use client";

import { useActionState } from "react";

import {
  createAssessmentPeriod,
} from "./actions";

type AcademicYear = {
  id: string;
  name: string;
};

type Term = {
  id: string;
  name: string;
  academicYearId: string;
};

type Props = {
  academicYears: AcademicYear[];
  terms: Term[];
};

const initialState = {
  error: "",
};

export default function AssessmentPeriodForm({
  academicYears,
  terms,
}: Props) {
  const [state, formAction, pending] =
    useActionState(
      createAssessmentPeriod,
      initialState,
    );

  return (
    <form
      action={formAction}
      className="space-y-6"
    >
      {state.error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-slate-900">
          Academic year
        </label>

        <select
          name="academicYearId"
          required
          defaultValue=""
          className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm"
        >
          <option value="" disabled>
            Select academic year
          </option>

          {academicYears.map((year) => (
            <option
              key={year.id}
              value={year.id}
            >
              {year.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-900">
          Term
        </label>

        <select
          name="termId"
          required
          defaultValue=""
          className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm"
        >
          <option value="" disabled>
            Select term
          </option>

          {terms.map((term) => (
            <option
              key={term.id}
              value={term.id}
            >
              {term.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-900">
          Period name
        </label>

        <input
          name="name"
          required
          placeholder="e.g. Term 1 Continuous Assessment"
          className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-slate-900">
            Start date
          </label>

          <input
            type="date"
            name="startDate"
            className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-900">
            End date
          </label>

          <input
            type="date"
            name="endDate"
            className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-900">
          Description
        </label>

        <textarea
          name="description"
          rows={4}
          className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
      >
        {pending
          ? "Creating..."
          : "Create assessment period"}
      </button>
    </form>
  );
}

