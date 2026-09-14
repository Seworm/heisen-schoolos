"use client";

import { useActionState } from "react";

import { createGradingScheme } from "./actions";

const initialState = {
  error: undefined,
};

export default function GradingSchemeForm() {
  const [state, formAction, pending] =
    useActionState(
      createGradingScheme,
      initialState,
    );

  return (
    <form
      action={formAction}
      className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      {state?.error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      <div>
        <label
          htmlFor="name"
          className="block text-sm font-semibold text-slate-800"
        >
          Scheme name
        </label>

        <input
          id="name"
          name="name"
          required
          maxLength={150}
          placeholder="e.g. Standard Basic School Grading"
          className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-200"
        />
      </div>

      <div>
        <label
          htmlFor="description"
          className="block text-sm font-semibold text-slate-800"
        >
          Description
        </label>

        <textarea
          id="description"
          name="description"
          rows={4}
          placeholder="Describe when this grading scheme should be used."
          className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-200"
        />
      </div>

      <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
        <a
          href="/assessments/grading"
          className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Cancel
        </a>

        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending
            ? "Creating..."
            : "Create scheme"}
        </button>
      </div>
    </form>
  );
}