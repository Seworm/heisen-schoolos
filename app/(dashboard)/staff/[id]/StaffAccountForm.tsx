"use client";

import { useActionState } from "react";
import { inviteStaffAccount, type InviteStaffAccountResult } from "./actions";

const staffRoles = [
  ["school_admin", "School administrator"],
  ["principal", "Principal"],
  ["headteacher", "Headteacher"],
  ["accountant", "Accountant"],
  ["bursar", "Bursar"],
  ["secretary", "Secretary"],
  ["librarian", "Librarian"],
  ["nurse", "Nurse"],
  ["teacher", "Teacher"],
  ["staff", "General staff"],
] as const;

export default function StaffAccountForm({
  staffId,
  firstName,
  lastName,
  email,
  canInvite,
}: {
  staffId: string;
  firstName: string;
  lastName: string;
  email: string | null;
  canInvite: boolean;
}) {
  const [state, action, pending] = useActionState(
    inviteStaffAccount,
    null as unknown as InviteStaffAccountResult,
  );

  if (!canInvite) {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
        You do not have permission to create login accounts for staff.
      </div>
    );
  }

  if (state?.success) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
        <p className="text-sm text-emerald-800">{state.success}</p>
      </div>
    );
  }

  return (
    <form action={action} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="font-semibold text-slate-950">Create login account</h3>
      <p className="mt-1 text-sm text-slate-500">
        Invite {firstName} {lastName} to create their own password via a secure invitation link. The staff member will not know the password — they set it themselves from the email link.
      </p>

      {email && (
        <p className="mt-3 text-sm text-slate-700">
          <span className="font-medium">Email:</span> {email}
        </p>
      )}

      {!email && (
        <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
          No email address is on record. Add an email to the staff member&apos;s
          profile before inviting them to create an account.
        </p>
      )}

      <input type="hidden" name="staffId" value={staffId} />

      <label
        htmlFor="accountRole"
        className="mt-4 block text-sm font-medium text-slate-700"
      >
        Account role
      </label>
      <select
        id="accountRole"
        name="role"
        defaultValue="teacher"
        className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-200"
      >
        {staffRoles.map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>

      {state?.error && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      <button
        type="submit"
        disabled={pending || !email}
        className="mt-5 w-full rounded-xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Sending invitation..." : "Send invitation"}
      </button>
    </form>
  );
}
