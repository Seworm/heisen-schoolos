import { count, desc, eq } from "drizzle-orm";
import Link from "next/link";
import { db } from "@/db";
import { schoolMemberships, staff, students, auditLogs } from "@/db/schema";
import { getCurrentSchool } from "@/lib/current-school";
import { getApplicationSession } from "@/lib/auth/compat";
import { getAvailableSchools } from "@/lib/school-workspace";
import StaffAccessForm from "./StaffAccessForm";

export const dynamic = "force-dynamic";
export default async function AdminPage() {
  const school = await getCurrentSchool();
  const session = await getApplicationSession();
  const availableSchools = session?.user.isPlatformAdmin
    ? await getAvailableSchools()
    : [];
  const [members, staffCount, studentCount, audits] = await Promise.all([
    db.select({ count: count() }).from(schoolMemberships).where(eq(schoolMemberships.schoolId, school.id)),
    db.select({ count: count() }).from(staff).where(eq(staff.schoolId, school.id)),
    db.select({ count: count() }).from(students).where(eq(students.schoolId, school.id)),
    db.select().from(auditLogs).where(eq(auditLogs.schoolId, school.id)).orderBy(desc(auditLogs.createdAt)).limit(20),
  ]);
  return <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8"><p className="text-sm text-slate-500">Administration</p><h1 className="text-3xl font-semibold tracking-tight">School administration</h1><p className="mt-1 text-sm text-slate-500">Memberships, security events and operational oversight.</p><div className="mt-7 grid gap-4 sm:grid-cols-3"><Metric label="Members" value={String(members[0]?.count ?? 0)}/><Metric label="Staff" value={String(staffCount[0]?.count ?? 0)}/><Metric label="Students" value={String(studentCount[0]?.count ?? 0)}/></div><div className="mt-7"><StaffAccessForm schools={availableSchools} currentSchoolId={school.id} isPlatformAdmin={Boolean(session?.user.isPlatformAdmin)} /></div><section className="mt-7 rounded-xl border border-slate-200 bg-white p-5"><h2 className="font-semibold">Administrator security</h2><p className="mt-1 text-sm text-slate-500">Protect administrator sign-ins with an authenticator app and recovery codes.</p>  <Link href="/auth/two-factor" className="mt-4 inline-flex rounded-lg bg-slate-950 px-4 py-2 text-sm font-medium text-white">Configure two-factor authentication</Link></section><section className="mt-7 rounded-xl border border-slate-200 bg-white"><div className="border-b border-slate-200 px-5 py-4"><h2 className="font-semibold">Audit activity</h2></div><div className="divide-y divide-slate-100">{audits.map((a) => <div key={a.id} className="flex flex-wrap justify-between gap-2 px-5 py-3 text-sm"><span><strong>{a.action}</strong> · {a.entity}{a.entityId ? ` · ${a.entityId}` : ""}</span><span className="text-slate-400">{new Date(a.createdAt).toLocaleString()}</span></div>)}{audits.length === 0 && <p className="px-5 py-10 text-center text-sm text-slate-500">No audit events recorded.</p>}</div></section></main>;
}
function Metric({label,value}:{label:string;value:string}){return <div className="rounded-xl border border-slate-200 bg-white p-5"><p className="text-sm text-slate-500">{label}</p><p className="mt-2 text-2xl font-semibold">{value}</p></div>}
