"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { grantSchoolMembership, reactivateSchoolMembership, revokeSchoolMembership, updatePlatformUserStatus, updateSchoolMembership } from "./actions";

const roles = ["school_owner", "school_admin", "principal", "headteacher", "teacher", "accountant", "bursar", "secretary", "librarian", "nurse", "parent", "student", "staff"];
type Row = { membershipId: string; userId: string; email: string; name: string; userStatus: string; schoolId: string; schoolName: string; role: string; isActive: boolean };

export default function MembershipManager({ rows, schools }: { rows: Row[]; schools: Array<{ id: string; name: string }> }) {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", schoolId: schools[0]?.id ?? "", role: "teacher" });
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  async function run(task: () => Promise<unknown>) {
    setPending(true); setMessage("");
    try { await task(); setMessage("Access updated."); router.refresh(); } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to update access."); } finally { setPending(false); }
  }
  return <div className="space-y-6">
    <form onSubmit={(event) => { event.preventDefault(); void run(() => grantSchoolMembership(form)); }} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="font-bold">Grant school membership</h2><p className="mt-1 text-sm text-slate-500">The user must already have a local account.</p>
      <div className="mt-4 grid gap-3 md:grid-cols-4">
        <input required type="email" placeholder="User email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        <select required value={form.schoolId} onChange={(e) => setForm({ ...form, schoolId: e.target.value })} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">{schools.map((school) => <option key={school.id} value={school.id}>{school.name}</option>)}</select>
        <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">{roles.map((role) => <option key={role} value={role}>{role.replace("_", " ")}</option>)}</select>
        <button disabled={pending} className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Grant access</button>
      </div>{message && <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">{message}</p>}
    </form>
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-100 px-5 py-4"><h2 className="font-bold">Cross-school roster</h2><p className="mt-1 text-sm text-slate-500">{rows.length} membership records</p></div>
      <div className="divide-y divide-slate-100">{rows.map((row) => <MembershipRow key={row.membershipId} row={row} pending={pending} run={run} />)}{rows.length === 0 && <p className="px-5 py-10 text-center text-sm text-slate-500">No school memberships found.</p>}</div>
    </section>
  </div>;
}

function MembershipRow({ row, pending, run }: { row: Row; pending: boolean; run: (task: () => Promise<unknown>) => Promise<void> }) {
  const [role, setRole] = useState(row.role);
  return <div className="flex flex-wrap items-center gap-4 px-5 py-4"><div className="min-w-56 flex-1"><p className="font-semibold">{row.name}</p><p className="text-xs text-slate-500">{row.email} · {row.schoolName}</p></div>
    <span className={`rounded-full px-2 py-1 text-xs font-semibold ${row.isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{row.isActive ? "Active" : "Revoked"}</span>
    <select disabled={!row.isActive || pending} value={role} onChange={(e) => { setRole(e.target.value); void run(() => updateSchoolMembership({ membershipId: row.membershipId, role: e.target.value })); }} className="rounded-lg border border-slate-300 px-2 py-1.5 text-xs">{roles.map((value) => <option key={value} value={value}>{value.replace("_", " ")}</option>)}</select>
    <select disabled={pending} value={row.userStatus} onChange={(e) => void run(() => updatePlatformUserStatus({ userId: row.userId, status: e.target.value as "active" | "inactive" | "suspended" }))} className="rounded-lg border border-slate-300 px-2 py-1.5 text-xs"><option value="active">User active</option><option value="inactive">User inactive</option><option value="suspended">User suspended</option></select>
    {row.isActive ? <button disabled={pending} onClick={() => { if (window.confirm(`Remove ${row.name} from ${row.schoolName}?`)) void run(() => revokeSchoolMembership(row.membershipId)); }} className="text-xs font-semibold text-rose-600">Remove from school</button> : <button disabled={pending} onClick={() => void run(() => reactivateSchoolMembership(row.membershipId))} className="text-xs font-semibold text-emerald-600">Restore school access</button>}
  </div>;
}
