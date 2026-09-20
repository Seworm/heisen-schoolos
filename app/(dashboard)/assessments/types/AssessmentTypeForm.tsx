"use client";

import Link from "next/link";

import { useActionState } from "react";

import { createAssessmentType } from "./actions";

const initialState = {
  error: "",
};

export default function AssessmentTypeForm() {
  const [state, formAction, pending] =
    useActionState(
      createAssessmentType,
      initialState,
    );

  return (
    <form
      action={formAction}
      className="space-y-6"
    >
      {state.error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-sm font-medium text-red-800">
            {state.error}
          </p>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-slate-900"
          >
            Assessment type name
          </label>

          <input
            id="name"
            name="name"
            type="text"
            required
            placeholder="e.g. Class Test"
            className="mt-2 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
          />

          <p className="mt-1.5 text-xs text-slate-500">
            The name teachers and administrators will see.
          </p>
        </div>

        <div>
          <label
            htmlFor="code"
            className="block text-sm font-medium text-slate-900"
          >
            Code
          </label>

          <input
            id="code"
            name="code"
            type="text"
            placeholder="e.g. CAT"
            maxLength={50}
            className="mt-2 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm uppercase text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
          />

          <p className="mt-1.5 text-xs text-slate-500">
            Optional internal code for the assessment type.
          </p>
        </div>

        <div>
          <label
            htmlFor="category"
            className="block text-sm font-medium text-slate-900"
          >
            Category
          </label>

          <select
            id="category"
            name="category"
            defaultValue="continuous_assessment"
            required
            className="mt-2 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
          >
            <option value="continuous_assessment">
              Continuous Assessment
            </option>

            <option value="examination">
              Examination
            </option>
          </select>

          <p className="mt-1.5 text-xs text-slate-500">
            Determines how the assessment is classified.
          </p>
        </div>
      </div>

      <div>
        <label
          htmlFor="description"
          className="block text-sm font-medium text-slate-900"
        >
          Description
        </label>

        <textarea
          id="description"
          name="description"
          rows={4}
          placeholder="Optional description..."
          className="mt-2 block w-full resize-none rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
        />

        <p className="mt-1.5 text-xs text-slate-500">
          Optional information about this assessment type.
        </p>
      </div>

      <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-6">
        <Link
          href="/assessments/types"
          className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          Cancel
        </Link>

        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending
            ? "Creating..."
            : "Create assessment type"}
        </button>
      </div>
    </form>
  );
}


