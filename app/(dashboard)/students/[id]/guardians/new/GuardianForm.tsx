"use client";

import { useActionState } from "react";
import Link from "next/link";

type GuardianFormState = {
  error?: string;
  temporaryPassword?: string;
};

type GuardianFormProps = {
  studentId: string;
  studentName: string;
  action: (
    state: GuardianFormState,
    formData: FormData,
  ) => Promise<GuardianFormState>;
};

const initialState: GuardianFormState = {};

export default function GuardianForm({
  studentId,
  studentName,
  action,
}: GuardianFormProps) {
  const [state, formAction, isPending] = useActionState(
    action,
    initialState,
  );

  return (
    <form
      action={formAction}
      className="rounded-xl border border-slate-200 bg-white shadow-sm"
    >
      <input
        type="hidden"
        name="studentId"
        value={studentId}
      />

      <div className="border-b border-slate-200 px-6 py-5">
        <h2 className="text-base font-semibold text-slate-950">
          Guardian Information
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Enter the guardian&apos;s contact and relationship details.
        </p>
      </div>

      <div className="space-y-6 px-6 py-6">
        {state.error && (
          <div
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 px-4 py-3"
          >
            <p className="text-sm font-medium text-red-900">
              Unable to add guardian
            </p>

            <p className="mt-1 text-sm text-red-700">
              {state.error}
            </p>
          </div>
        )}
        {state.temporaryPassword && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Guardian account created. Temporary password: <strong>{state.temporaryPassword}</strong>
            <span className="mt-1 block text-xs">Share this securely. It expires in 24 hours and must be changed after first login.</span>
          </div>
        )}

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label
              htmlFor="firstName"
              className="block text-sm font-medium text-slate-700"
            >
              First name
            </label>

            <input
              id="firstName"
              name="firstName"
              type="text"
              required
              disabled={isPending}
              className="mt-2 block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:bg-slate-100"
              placeholder="e.g. Kwame"
            />
          </div>

          <div>
            <label
              htmlFor="lastName"
              className="block text-sm font-medium text-slate-700"
            >
              Last name
            </label>

            <input
              id="lastName"
              name="lastName"
              type="text"
              required
              disabled={isPending}
              className="mt-2 block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:bg-slate-100"
              placeholder="e.g. Mensah"
            />
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label
              htmlFor="relationship"
              className="block text-sm font-medium text-slate-700"
            >
              Relationship
            </label>

            <select
              id="relationship"
              name="relationship"
              required
              defaultValue=""
              disabled={isPending}
              className="mt-2 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:bg-slate-100"
            >
              <option value="" disabled>
                Select relationship
              </option>
              <option value="Father">Father</option>
              <option value="Mother">Mother</option>
              <option value="Guardian">Guardian</option>
              <option value="Grandfather">Grandfather</option>
              <option value="Grandmother">Grandmother</option>
              <option value="Uncle">Uncle</option>
              <option value="Aunt">Aunt</option>
              <option value="Sibling">Sibling</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="phone"
              className="block text-sm font-medium text-slate-700"
            >
              Phone number
            </label>

            <input
              id="phone"
              name="phone"
              type="tel"
              required
              disabled={isPending}
              className="mt-2 block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:bg-slate-100"
              placeholder="e.g. 024 123 4567"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-slate-700"
          >
            Email address
            <span className="ml-1 font-normal text-slate-400">
              (optional)
            </span>
          </label>

          <input
            id="email"
            name="email"
            type="email"
            disabled={isPending}
            className="mt-2 block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:bg-slate-100"
            placeholder="guardian@example.com"
          />
        </div>

        <div>
          <label
            htmlFor="address"
            className="block text-sm font-medium text-slate-700"
          >
            Address
            <span className="ml-1 font-normal text-slate-400">
              (optional)
            </span>
          </label>

          <textarea
            id="address"
            name="address"
            rows={3}
            disabled={isPending}
            className="mt-2 block w-full resize-none rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:bg-slate-100"
            placeholder="Residential address"
          />
        </div>

        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <label className="flex cursor-pointer items-start gap-3">
            <input
              id="isPrimary"
              name="isPrimary"
              type="checkbox"
              disabled={isPending}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-slate-950 focus:ring-slate-400 disabled:opacity-50"
            />

            <span>
              <span className="block text-sm font-medium text-slate-900">
                Primary guardian
              </span>

              <span className="mt-1 block text-sm text-slate-500">
                Mark this person as the primary guardian for{" "}
                {studentName}.
              </span>
            </span>
          </label>
        </div>
      </div>

      <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4 sm:flex-row sm:justify-end">
        <Link
          href={`/students/${studentId}`}
          className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          Cancel
        </Link>

        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center justify-center rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Adding Guardian..." : "Add Guardian"}
        </button>
      </div>
    </form>
  );
}