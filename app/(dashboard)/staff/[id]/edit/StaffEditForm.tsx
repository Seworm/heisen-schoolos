"use client";

import { useActionState } from "react";
import Link from "next/link";

import { updateStaff } from "./actions";

type StaffMember = {
  id: string;
  firstName: string;
  middleName: string | null;
  lastName: string;
  staffNumber: string;
  gender: "male" | "female" | null;
  dateOfBirth: string | null;
  phone: string | null;
  email: string | null;
  employmentDate: string | null;
  position: string | null;
  status: "active" | "inactive";
};

type FormState = {
  error?: string;
  fieldErrors?: {
    firstName?: string;
    lastName?: string;
    staffNumber?: string;
    email?: string;
  };
};

const initialState: FormState = {};

type StaffEditFormProps = {
  staffMember: StaffMember;
};

export default function StaffEditForm({
  staffMember,
}: StaffEditFormProps) {
  const updateStaffWithId = updateStaff.bind(
    null,
    staffMember.id,
  );

  const [state, formAction, pending] = useActionState(
    updateStaffWithId,
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
          Update the staff member&apos;s basic details.
        </p>
      </div>

      <div className="space-y-6 px-6 py-6">
        {state.error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {state.error}
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
              defaultValue={staffMember.firstName}
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-200"
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
              defaultValue={staffMember.middleName ?? ""}
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-200"
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
              defaultValue={staffMember.lastName}
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-200"
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
              defaultValue={staffMember.gender ?? ""}
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-200"
            >
              <option value="">Select gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="dateOfBirth"
              className="block text-sm font-medium text-slate-700"
            >
              Date of birth
            </label>

            <input
              id="dateOfBirth"
              name="dateOfBirth"
              type="date"
              defaultValue={staffMember.dateOfBirth ?? ""}
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-200"
            />
          </div>
        </div>

        <div className="border-t border-slate-100 pt-6">
          <h2 className="text-base font-semibold text-slate-950">
            Employment information
          </h2>
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
              defaultValue={staffMember.staffNumber}
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm uppercase outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-200"
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
            </label>

            <input
              id="position"
              name="position"
              type="text"
              defaultValue={staffMember.position ?? ""}
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-200"
            />
          </div>

          <div>
            <label
              htmlFor="employmentDate"
              className="block text-sm font-medium text-slate-700"
            >
              Employment date
            </label>

            <input
              id="employmentDate"
              name="employmentDate"
              type="date"
              defaultValue={staffMember.employmentDate ?? ""}
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
              defaultValue={staffMember.status}
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
              defaultValue={staffMember.phone ?? ""}
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-200"
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
              defaultValue={staffMember.email ?? ""}
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-200"
            />

            {state.fieldErrors?.email && (
              <p className="mt-1 text-xs text-red-600">
                {state.fieldErrors.email}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 px-6 py-5 sm:flex-row sm:justify-end">
        <Link
          href={`/staff/${staffMember.id}`}
          className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
        >
          Cancel
        </Link>

        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center justify-center rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Saving changes..." : "Save changes"}
        </button>
      </div>
    </form>
  );
}