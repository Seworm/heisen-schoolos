"use client";

import { useActionState } from "react";
import Link from "next/link";

import { createStaff } from "./actions";

type FormState = {
  error?: string;
  fieldErrors?: {
    firstName?: string;
    lastName?: string;
    staffNumber?: string;
    email?: string;
  };
  inviteUrl?: string;
};

const initialState: FormState = {} as FormState;

export default function StaffForm() {
  const [state, formAction, pending] = useActionState(
    createStaff,
    initialState,
  );

  return (
    <form
      action={formAction}
      className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
    >
      <div className="border-b border-slate-200 px-6 py-5">
        <h2 className="text-base font-semibold text-slate-950">
          Personal information
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Enter the staff member&apos;s basic details.
        </p>
      </div>

      <div className="space-y-6 px-6 py-6">
        {state.error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {state.error}
          </div>
        )}

        {state.inviteUrl && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm">
            <p className="font-semibold text-amber-900">
              Invitation created — email not sent
            </p>
            <p className="mt-1 text-sm text-amber-800">
              The staff member was created and an invitation exists, but the
              welcome email could not be delivered. Copy the link below and
              share it with them directly.
            </p>
            <div className="mt-3 break-all rounded-lg border border-amber-200 bg-white px-4 py-3 font-mono text-xs text-amber-900">
              {state.inviteUrl}
            </div>
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
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-200"
              placeholder="e.g. Kofi"
            />

            {state.fieldErrors?.firstName && (
              <p className="mt-1 text-xs text-red-600">
                {state.fieldErrors.firstName}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="middleName"
              className="block text-sm font-medium text-slate-700"
            >
              Middle name
              <span className="ml-1 text-slate-400">
                (optional)
              </span>
            </label>

            <input
              id="middleName"
              name="middleName"
              type="text"
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-200"
              placeholder="e.g. Mensah"
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
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-200"
              placeholder="e.g. Owusu"
            />

            {state.fieldErrors?.lastName && (
              <p className="mt-1 text-xs text-red-600">
                {state.fieldErrors.lastName}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="gender"
              className="block text-sm font-medium text-slate-700"
            >
              Gender
            </label>

            <select
              id="gender"
              name="gender"
              defaultValue=""
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-200"
            >
              <option value="">Select gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-6">
          <h2 className="text-base font-semibold text-slate-950">
            Employment information
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Details used to identify and manage the staff member.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label
              htmlFor="staffNumber"
              className="block text-sm font-medium text-slate-700"
            >
              Staff number
            </label>

            <input
              id="staffNumber"
              name="staffNumber"
              type="text"
              required
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm uppercase outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-200"
              placeholder="e.g. STF001"
            />

            {state.fieldErrors?.staffNumber && (
              <p className="mt-1 text-xs text-red-600">
                {state.fieldErrors.staffNumber}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="position"
              className="block text-sm font-medium text-slate-700"
            >
              Position
              <span className="ml-1 text-slate-400">
                (optional)
              </span>
            </label>

            <input
              id="position"
              name="position"
              type="text"
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-200"
              placeholder="e.g. Teacher"
            />
          </div>

          <div>
            <label
              htmlFor="employmentDate"
              className="block text-sm font-medium text-slate-700"
            >
              Employment date
              <span className="ml-1 text-slate-400">
                (optional)
              </span>
            </label>

            <input
              id="employmentDate"
              name="employmentDate"
              type="date"
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-200"
            />
          </div>

          <div>
            <label
              htmlFor="status"
              className="block text-sm font-medium text-slate-700"
            >
              Status
            </label>

            <select
              id="status"
              name="status"
              defaultValue="active"
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-200"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-6">
          <h2 className="text-base font-semibold text-slate-950">
            Contact information
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Contact details are optional but useful for school
            administration.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label
              htmlFor="phone"
              className="block text-sm font-medium text-slate-700"
            >
              Phone
            </label>

            <input
              id="phone"
              name="phone"
              type="tel"
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-200"
              placeholder="e.g. 024 000 0000"
            />
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-slate-700"
            >
              Email
            </label>

            <input
              id="email"
              name="email"
              type="email"
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-200"
              placeholder="e.g. staff@school.com"
            />

            {state.fieldErrors?.email && (
              <p className="mt-1 text-xs text-red-600">
                {state.fieldErrors.email}
              </p>
            )}
          </div>

          <div className="sm:col-span-2 rounded-xl border border-emerald-100 bg-emerald-50/50 p-4">
            <label className="flex items-center gap-3 text-sm font-semibold text-slate-800">
              <input name="createAccount" type="checkbox" className="h-4 w-4 accent-[#087443]" />
              Create a login account and email an invitation
            </label>
            <p className="mt-1 text-xs text-slate-500">The staff member creates their own password from the secure invitation link. Passwords are never emailed.</p>
            <label htmlFor="accountRole" className="mt-3 block text-sm font-medium text-slate-700">Account role</label>
            <select id="accountRole" name="accountRole" defaultValue="teacher" className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm">
              <option value="teacher">Teacher</option>
              <option value="headteacher">Headteacher</option>
              <option value="principal">Principal</option>
              <option value="accountant">Accountant</option>
              <option value="bursar">Bursar</option>
              <option value="secretary">Secretary</option>
              <option value="librarian">Librarian</option>
              <option value="nurse">Nurse</option>
              <option value="staff">General staff</option>
              <option value="school_admin">School administrator</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="dateOfBirth"
              className="block text-sm font-medium text-slate-700"
            >
              Date of birth
              <span className="ml-1 text-slate-400">
                (optional)
              </span>
            </label>

            <input
              id="dateOfBirth"
              name="dateOfBirth"
              type="date"
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-200"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 px-6 py-5 sm:flex-row sm:justify-end">
        <Link
          href="/staff"
          className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
        >
          Cancel
        </Link>

        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center justify-center rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Creating staff..." : "Create staff"}
        </button>
      </div>
    </form>
  );
}
