"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { createAcademicYear } from "./actions";

const initialState = {
  error: "",
};

export default function AcademicYearForm() {
  const [state, action] = useActionState(
    createAcademicYear,
    initialState,
  );

  return (
    <form action={action} className="space-y-6">
      {state.error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      <div>
        <label
          htmlFor="name"
          className="block text-sm font-medium text-slate-700"
        >
          Academic year
        </label>

        <input
          id="name"
          name="name"
          type="text"
          placeholder="2027/2028"
          required
          className="mt-2 block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label
            htmlFor="startDate"
            className="block text-sm font-medium text-slate-700"
          >
            Start date
          </label>

          <input
            id="startDate"
            name="startDate"
            type="date"
            required
            className="mt-2 block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
          />
        </div>

        <div>
          <label
            htmlFor="endDate"
            className="block text-sm font-medium text-slate-700"
          >
            End date
          </label>

          <input
            id="endDate"
            name="endDate"
            type="date"
            required
            className="mt-2 block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
          />
        </div>
      </div>

      <label className="flex items-start gap-3 rounded-lg border border-slate-200 p-4">
        <input
          type="checkbox"
          name="isCurrent"
          value="true"
          className="mt-0.5 h-4 w-4 rounded border-slate-300"
        />

        <span>
          <span className="block text-sm font-medium text-slate-900">
            Set as current academic year
          </span>

          <span className="mt-1 block text-xs text-slate-500">
            This will replace the school's existing current
            academic year.
          </span>
        </span>
      </label>

      <div className="flex justify-end gap-3 border-t border-slate-200 pt-5">
        <a
          href="/academics/years"
          className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Cancel
        </a>

        <SubmitButton />
      </div>
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Creating..." : "Create academic year"}
    </button>
  );
}