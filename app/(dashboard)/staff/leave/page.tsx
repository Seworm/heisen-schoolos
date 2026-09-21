import { asc, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { staff, staffLeaveRequests } from "@/db/schema";
import { requireCurrentSchool } from "@/lib/current-school";
import LeaveForms from "./LeaveForms";

export const dynamic = "force-dynamic";
export default async function StaffLeavePage() {
  const school = await requireCurrentSchool();
  const people = await db.select({ id: staff.id, name: staff.firstName, lastName: staff.lastName }).from(staff).where(eq(staff.schoolId, school.id)).orderBy(asc(staff.firstName));
  const requests = await db.select({ id: staffLeaveRequests.id, staffId: staffLeaveRequests.staffId, startsOn: staffLeaveRequests.startsOn, endsOn: staffLeaveRequests.endsOn, leaveType: staffLeaveRequests.leaveType, status: staffLeaveRequests.status, reason: staffLeaveRequests.reason }).from(staffLeaveRequests).where(eq(staffLeaveRequests.schoolId, school.id)).orderBy(desc(staffLeaveRequests.createdAt)).limit(100);
  const names = new Map(people.map((person) => [person.id, `${person.name} ${person.lastName}`]));
  return <div className="mx-auto max-w-6xl space-y-8"><header><p className="text-sm font-medium text-slate-500">People operations</p><h1 className="mt-1 text-2xl font-semibold">Staff leave & absence</h1><p className="mt-2 text-sm text-slate-500">Submit requests and keep approval decisions visible to school administrators.</p></header><LeaveForms people={people} /><section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="font-semibold">Requests</h2><div className="mt-4 divide-y divide-slate-100">{requests.map((request) => <div key={request.id} className="flex flex-wrap items-center justify-between gap-3 py-3"><div><p className="font-medium">{names.get(request.staffId) ?? "Staff member"}</p><p className="text-sm text-slate-500">{request.leaveType} · {request.startsOn} – {request.endsOn}</p></div><div className="flex items-center gap-3"><span className="rounded-full bg-slate-100 px-2 py-1 text-xs capitalize">{request.status}</span>{request.status === "pending" && <LeaveForms.Review id={request.id} />}</div></div>)}{requests.length === 0 && <p className="py-6 text-sm text-slate-500">No leave requests yet.</p>}</div></section></div>;
}
