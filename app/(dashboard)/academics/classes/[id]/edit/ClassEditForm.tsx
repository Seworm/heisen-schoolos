"use client";

import Link from "next/link";
import { useActionState } from "react";

import { updateClassLevel } from "./actions";

type ClassLevel = {
  id: string;
  name: string;
  category:
    | "creche"
    | "nursery"
    | "kg"
    | "primary"
    | "jhs";
  sortOrder: number;
};

type Props = {
  classLevel: ClassLevel;
};

type FormState = {
  error?: string;
};

const initialState: FormState = {};

export default function ClassEditForm({
  classLevel,
}: Props) {
  const [state, formAction, pending] =
    useActionState(
      updateClassLevel,
      initialState,
    );

  return (
    <div>
      <Link
        href={`/academics/classes/${classLevel.id}`}
        className="text-sm font-medium text-slate-500 hover:text-slate-900"
      >
        ← Back to class
      </Link>

      <div className="mt-4">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-950">
          Edit class
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Update the class level configuration.
        </p>
      </div>

      <form
        action={formAction}
        className="mt-8 space-y-6 rounded-xl border border-slate-200 bg-white p-6"
      >
        <input
          type="hidden"
          name="id"
          value={classLevel.id}
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
            Class name
          </label>

          <input
            id="name"
            name="name"
            defaultValue={classLevel.name}
            required
            className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
          />
        </div>

        <div>
          <label
            htmlFor="category"
            className="block text-sm font-medium text-slate-700"
          >
            Category
          </label>

          <select
            id="category"
            name="category"
            defaultValue={classLevel.category}
            required
            className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
          >
            <option value="creche">Creche</option>
            <option value="nursery">Nursery</option>
            <option value="kg">KG</option>
            <option value="primary">Primary</option>
            <option value="jhs">JHS</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="sortOrder"
            className="block text-sm font-medium text-slate-700"
          >
            Sort order
          </label>

          <input
            id="sortOrder"
            name="sortOrder"
            type="number"
            min="0"
            defaultValue={classLevel.sortOrder}
            required
            className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
          />
        </div>

        <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
          <Link
            href={`/academics/classes/${classLevel.id}`}
            className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={pending}
            className="rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? "Saving..." : "Save changes"}
          </button>
        </div>
      </form>
    </div>
  );
}