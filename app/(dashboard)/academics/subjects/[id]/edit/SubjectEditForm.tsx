"use client";

import { useActionState } from "react";
import Link from "next/link";

import { updateSubject } from "./actions";

type Subject = {
  id: string;
  name: string;
  code: string | null;
};

type Props = {
  subject: Subject;
};

type FormState = {
  error?: string;
};

const initialState: FormState = {};

export default function SubjectEditForm({
  subject,
}: Props) {
  const [state, formAction, pending] = useActionState(
    updateSubject,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-6">
      <input
        type="hidden"
        name="id"
        value={subject.id}
      />

      {state.error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      ) : null}

      <div>
        <label
          htmlFor="name"
          className="block text-sm font-medium text-slate-900"
        >
          Subject name
        </label>

        <input
          id="name"
          name="name"
          type="text"
          required
          maxLength={150}
          defaultValue={subject.name}
          placeholder="e.g. Mathematics"
          className="mt-2 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
        />
      </div>

      <div>
        <label
          htmlFor="code"
          className="block text-sm font-medium text-slate-900"
        >
          Subject code
        </label>

        <input
          id="code"
          name="code"
          type="text"
          maxLength={50}
          defaultValue={subject.code ?? ""}
          placeholder="e.g. MATH"
          className="mt-2 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm uppercase text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
        />

        <p className="mt-2 text-xs text-slate-500">
          Optional. The code will be stored in uppercase.
        </p>
      </div>

      <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:justify-end">
        <Link
          href="/academics/subjects"
          className="inline-flex items-center justify-center rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Cancel
        </Link>

        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center justify-center rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Saving..." : "Save changes"}
        </button>
      </div>
    </form>
  );
}