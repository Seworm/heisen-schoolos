"use client";
import { useActionState } from "react";
import { requestStaffLeave, reviewStaffLeave } from "../../operations/actions";
const initial = null;
type Person = { id: string; name: string; lastName: string | null };
function LeaveRequestForm({ people }: { people: Person[] }) {
  const [state, action] = useActionState(requestStaffLeave, initial);
  return <form action={action} className="grid gap-3 rounded-xl border border-slate-200 bg-white p-6 shadow-sm md:grid-cols-3"><h2 className="md:col-span-3 font-semibold">Submit leave request</h2><select name="staffId" required className="rounded-lg border p-2.5 text-sm"><option value="">Select staff member</option>{people.map((person) => <option key={person.id} value={person.id}>{person.name} {person.lastName}</option>)}</select><select name="leaveType" className="rounded-lg border p-2.5 text-sm"><option value="annual">Annual</option><option value="sick">Sick</option><option value="maternity">Maternity</option><option value="paternity">Paternity</option><option value="unpaid">Unpaid</option><option value="other">Other</option></select><input name="startsOn" type="date" required className="rounded-lg border p-2.5 text-sm" /><input name="endsOn" type="date" required className="rounded-lg border p-2.5 text-sm" /><input name="reason" placeholder="Reason (optional)" className="rounded-lg border p-2.5 text-sm md:col-span-2" /><button className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white">Submit request</button>{state?.error && <p className="text-sm text-red-600 md:col-span-3">{state.error}</p>}{state?.success && <p className="text-sm text-green-700 md:col-span-3">{state.success}</p>}</form>;
}
function Review({ id }: { id: string }) {
  return <form action={reviewStaffLeave} className="flex gap-1"><input type="hidden" name="id" value={id} /><button name="status" value="approved" className="rounded bg-green-100 px-2 py-1 text-xs text-green-800">Approve</button><button name="status" value="rejected" className="rounded bg-red-100 px-2 py-1 text-xs text-red-800">Reject</button></form>;
}
const LeaveForms = Object.assign(LeaveRequestForm, { Review });
export default LeaveForms;
