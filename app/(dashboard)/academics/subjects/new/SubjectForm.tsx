"use client";

import Link from "next/link";
import { useActionState } from "react";

import { createSubject } from "./actions";

type FormState = {
  error?: string;
};

const initialState: FormState = {};

export default function SubjectForm() {
  const [state, formAction, pending] =
    useActionState(
      createSubject,
      initialState,
    );

  return (
    <form
      action={formAction}
      className="space-y-6 rounded-xl border border-slate-200 bg-white p-6"
    >
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
          Subject name
        </label>

        <input
          id="name"
          name="name"
          placeholder="Mathematics"
          maxLength={150}
          required
          className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
        />
      </div>

      <div>
        <label
          htmlFor="code"
          className="block text-sm font-medium text-slate-700"
        >
          Subject code
          <span className="ml-1 font-normal text-slate-400">
            optional
          </span>
        </label>

        <input
          id="code"
          name="code"
          placeholder="MATH"
          maxLength={50}
          className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm uppercase outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
        />

        <p className="mt-2 text-xs text-slate-500">
          Use a short code if the school uses subject codes.
        </p>
      </div>

      <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
        <Link
          href="/academics/subjects"
          className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Cancel
        </Link>

        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Creating..." : "Create subject"}
        </button>
      </div>
    </form>
  );
}

