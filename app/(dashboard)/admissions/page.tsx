import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { applicants } from "@/db/schema";
import { requireCurrentSchool } from "@/lib/current-school";
import { createApplicant, markApplicantUnderReview, decideApplicant, convertApplicant } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdmissionsPage() {
  const school = await requireCurrentSchool();
  const rows = await db.select().from(applicants).where(eq(applicants.schoolId, school.id)).orderBy(desc(applicants.createdAt));
  return <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
    <div className="flex items-end justify-between"><div><p className="text-sm font-medium text-slate-500">Admissions</p><h1 className="mt-1 text-3xl font-semibold text-slate-950">Applicant intake & review</h1><p className="mt-2 text-sm text-slate-500">School-scoped pipeline for {school.name}.</p></div><Link href="/students" className="rounded-lg border px-4 py-2 text-sm">Students</Link></div>
    <form action={createApplicant} className="mt-8 grid gap-4 rounded-xl border bg-white p-6 shadow-sm md:grid-cols-4">
      <h2 className="md:col-span-4 text-base font-semibold">New application</h2>
      <input name="firstName" required placeholder="First name" className="rounded-lg border px-3 py-2" />
      <input name="middleName" placeholder="Middle name" className="rounded-lg border px-3 py-2" />
      <input name="lastName" required placeholder="Last name" className="rounded-lg border px-3 py-2" />
      <select name="gender" className="rounded-lg border bg-white px-3 py-2"><option value="">Gender</option><option value="male">Male</option><option value="female">Female</option></select>
      <input name="dateOfBirth" type="date" className="rounded-lg border px-3 py-2" />
      <input name="guardianName" required placeholder="Guardian name" className="rounded-lg border px-3 py-2" />
      <input name="guardianPhone" required placeholder="Guardian phone" className="rounded-lg border px-3 py-2" />
      <input name="guardianEmail" type="email" placeholder="Guardian email" className="rounded-lg border px-3 py-2" />
      <input name="requestedGrade" placeholder="Requested grade/class" className="rounded-lg border px-3 py-2" />
      <input name="notes" placeholder="Notes" className="rounded-lg border px-3 py-2 md:col-span-2" />
      <button className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-medium text-white">Submit application</button>
    </form>
    <section className="mt-8 overflow-hidden rounded-xl border bg-white shadow-sm"><div className="border-b px-6 py-4"><h2 className="font-semibold">Applications ({rows.length})</h2></div><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-slate-50"><tr><th className="px-6 py-3">Applicant</th><th className="px-6 py-3">Application</th><th className="px-6 py-3">Grade</th><th className="px-6 py-3">Status</th><th className="px-6 py-3">Actions</th></tr></thead><tbody className="divide-y">{rows.map((row) => <tr key={row.id}><td className="px-6 py-3 font-medium">{row.firstName} {row.lastName}<div className="text-xs text-slate-500">{row.guardianName} · {row.guardianPhone}</div></td><td className="px-6 py-3">{row.applicationNumber}</td><td className="px-6 py-3">{row.requestedGrade || "—"}</td><td className="px-6 py-3 capitalize">{row.status.replace("_", " ")}</td><td className="px-6 py-3"><div className="flex flex-wrap gap-2">{row.status === "submitted" && <form action={markApplicantUnderReview.bind(null, row.id)}><button className="rounded border px-2 py-1 text-xs">Review</button></form>}{row.status === "under_review" && <><form action={decideApplicant.bind(null, row.id, "accepted")}><button className="rounded bg-emerald-600 px-2 py-1 text-xs text-white">Accept</button></form><form action={decideApplicant.bind(null, row.id, "rejected")}><button className="rounded bg-rose-600 px-2 py-1 text-xs text-white">Reject</button></form></>}{row.status === "accepted" && <form action={convertApplicant.bind(null, row.id)}><button className="rounded bg-blue-600 px-2 py-1 text-xs text-white">Convert to student</button></form>}</div></td></tr>)}</tbody></table></div></section>
  </div>;
}
