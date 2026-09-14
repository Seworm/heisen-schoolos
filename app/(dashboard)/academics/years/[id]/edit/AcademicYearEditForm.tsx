"use client";

import Link from "next/link";
import { useActionState } from "react";

import {
  updateAcademicYear,
  type AcademicYearFormState,
} from "./actions";

type Props = {
  academicYearId: string;
  initialName: string;
  initialStartDate: string;
  initialEndDate: string;
  initialIsCurrent: boolean;
};

const initialState: AcademicYearFormState = {};

export default function AcademicYearEditForm({
  academicYearId,
  initialName,
  initialStartDate,
  initialEndDate,
  initialIsCurrent,
}: Props) {
  const [state, formAction, pending] =
    useActionState(
      updateAcademicYear,
      initialState,
    );

  return (
    <form action={formAction} className="space-y-6">
      <input
        type="hidden"
        name="academicYearId"
        value={academicYearId}
      />

      <div>
        <label
          htmlFor="name"
          className="block text-sm font-medium text-slate-900"
        >
          Academic year
        </label>

        <input
          id="name"
          name="name"
          type="text"
          required
          defaultValue={initialName}
          placeholder="2027/2028"
          className="mt-2 block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
        />
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label
            htmlFor="startDate"
            className="block text-sm font-medium text-slate-900"
          >
            Start date
          </label>

          <input
            id="startDate"
            name="startDate"
            type="date"
            required
            defaultValue={initialStartDate}
            className="mt-2 block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
          />
        </div>

        <div>
          <label
            htmlFor="endDate"
            className="block text-sm font-medium text-slate-900"
          >
            End date
          </label>

          <input
            id="endDate"
            name="endDate"
            type="date"
            required
            defaultValue={initialEndDate}
            className="mt-2 block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
          />
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            name="isCurrent"
            value="true"
            defaultChecked={initialIsCurrent}
            className="mt-1 h-4 w-4 rounded border-slate-300"
          />

          <span>
            <span className="block text-sm font-medium text-slate-900">
              Set as current academic year
            </span>

            <span className="mt-1 block text-xs text-slate-500">
              This will make this the active academic year for
              the school.
            </span>
          </span>
        </label>
      </div>

      {state.error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-6">
        <Link
          href={`/academics/years/${academicYearId}`}
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
  );
}