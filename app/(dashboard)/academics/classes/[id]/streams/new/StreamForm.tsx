"use client";

import Link from "next/link";
import { useActionState } from "react";

import { createStream } from "./actions";

type FormState = {
  error?: string;
};

const initialState: FormState = {};

type Props = {
  classLevelId: string;
  className: string;
};

export default function StreamForm({
  classLevelId,
  className,
}: Props) {
  const [state, formAction, pending] =
    useActionState(
      createStream,
      initialState,
    );

  return (
    <form
      action={formAction}
      className="space-y-6 rounded-xl border border-slate-200 bg-white p-6"
    >
      <input
        type="hidden"
        name="classLevelId"
        value={classLevelId}
      />

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
          Stream name
        </label>

        <input
          id="name"
          name="name"
          placeholder="A"
          required
          maxLength={50}
          className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
        />

        <p className="mt-2 text-xs text-slate-500">
          Example: A, B, C or Gold.
        </p>
      </div>

      <div>
        <label
          htmlFor="capacity"
          className="block text-sm font-medium text-slate-700"
        >
          Capacity
        </label>

        <input
          id="capacity"
          name="capacity"
          type="number"
          min="1"
          max="1000"
          defaultValue="40"
          required
          className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
        />

        <p className="mt-2 text-xs text-slate-500">
          Maximum number of students allowed in this
          stream.
        </p>
      </div>

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <p className="text-sm font-medium text-slate-900">
          {className}
        </p>

        <p className="mt-1 text-xs text-slate-500">
          The stream will belong to this class level.
        </p>
      </div>

      <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
        <Link
          href={`/academics/classes/${classLevelId}`}
          className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Cancel
        </Link>

        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Creating..." : "Create stream"}
        </button>
      </div>
    </form>
  );
}