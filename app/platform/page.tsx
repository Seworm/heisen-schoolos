import Link from "next/link";
import { Activity, ArrowUpRight, Building2, ShieldCheck, Sparkles } from "lucide-react";
import { count, countDistinct, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { auditLogs, schoolMemberships, schools, staff, students } from "@/db/schema";
import { requireSuperAdmin } from "@/lib/authorization";
import PlatformAdminForm from "./PlatformAdminForm";
import SchoolWorkspaceButton from "./SchoolWorkspaceButton";
import SchoolSubscriptionControl from "./SchoolSubscriptionControl";

export const dynamic = "force-dynamic";

export default async function PlatformPage() {
  await requireSuperAdmin();

  const schoolRows = await db
    .select({
      id: schools.id,
      name: schools.name,
      slug: schools.slug,
      schoolCode: schools.schoolCode,
      status: schools.status,
      createdAt: schools.createdAt,
      members: countDistinct(schoolMemberships.id),
      staff: countDistinct(staff.id),
      students: countDistinct(students.id),
    })
    .from(schools)
    .leftJoin(schoolMemberships, eq(schoolMemberships.schoolId, schools.id))
    .leftJoin(staff, eq(staff.schoolId, schools.id))
    .leftJoin(students, eq(students.schoolId, schools.id))
    .groupBy(schools.id)
    .orderBy(desc(schools.createdAt));

  const [auditSummary] = await db
    .select({ count: count() })
    .from(auditLogs);

  return (
    <main className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8">
      <section className="relative overflow-hidden rounded-3xl border border-[#dfe8e2] bg-[#f3faf5] px-6 py-8 text-slate-900 shadow-sm sm:px-8">
        <div className="absolute -right-16 -top-24 h-64 w-64 rounded-full bg-[#dff5e3] blur-3xl" />
        <div className="absolute bottom-[-5rem] right-1/3 h-48 w-48 rounded-full bg-[#edf7f0] blur-3xl" />
        <div className="relative flex flex-wrap items-end justify-between gap-6">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#cfe4d5] bg-[#edf7f0] px-3 py-1.5 text-xs font-semibold text-[#005530]">
              <Sparkles className="h-3.5 w-3.5" /> Platform command center
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Every school. One clear view.</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600">Operate your education network with secure tenant isolation, live school switching and platform-wide oversight.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/platform/reports" className="inline-flex items-center gap-2 rounded-xl border border-[#dfe8e2] bg-white px-4 py-2.5 text-sm font-bold text-slate-800 transition hover:bg-[#edf7f0]">
              <Activity className="h-4 w-4" /> Reports
            </Link>
            <Link href="/platform/memberships" className="inline-flex items-center gap-2 rounded-xl border border-[#dfe8e2] bg-white px-4 py-2.5 text-sm font-bold text-slate-800 transition hover:bg-[#edf7f0]">
              Manage access
            </Link>
            <Link href="/platform/schools/new" className="inline-flex items-center gap-2 rounded-xl bg-[#0a5d3a] px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#005530]">
              <Building2 className="h-4 w-4" /> Add school <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
      <div className="mt-6">
        <PlatformAdminForm />
      </div>
      <div className="mt-1 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mt-8 text-sm font-semibold text-violet-600">Platform administration</p>
          <h2 className="text-2xl font-bold tracking-tight">All schools</h2>
          <p className="mt-1 text-sm text-slate-500">
            Manage every school from one platform workspace.
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Metric label="Schools" value={String(schoolRows.length)} />
        <Metric
          label="Active schools"
          value={String(schoolRows.filter((school) => school.status === "active").length)}
        />
        <Metric label="Audit events" value={String(auditSummary?.count ?? 0)} />
      </div>

      <section className="mt-7 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-5">
          <div><h2 className="font-bold">School directory</h2><p className="mt-1 text-xs text-slate-500">Tenant health and operational footprint</p></div>
          <ShieldCheck className="h-5 w-5 text-emerald-500" />
        </div>
        <div className="divide-y divide-slate-100">
          {schoolRows.map((school) => (
            <div key={school.id} className="flex flex-wrap items-center justify-between gap-4 px-5 py-5 transition hover:bg-slate-50/80">
              <div>
                <div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-50 to-violet-100 text-blue-600"><Building2 className="h-4 w-4" /></span><p className="font-bold">{school.name}</p></div>
                <p className="mt-1 text-xs text-slate-500">
                  {school.schoolCode} · {school.slug} · {school.status}
                </p>
              </div>
              <div className="flex items-center gap-5 text-right text-xs text-slate-500">
                <span className="hidden items-center gap-1.5 text-emerald-600 sm:flex"><Activity className="h-3.5 w-3.5" /> {school.status}</span>
                <span>{school.members} members</span>
                <span>{school.staff} staff</span>
                <span>{school.students} students</span>
                <SchoolSubscriptionControl schoolId={school.id} status={school.status} />
                {school.status !== "deactivated" && (
                  <SchoolWorkspaceButton schoolId={school.id} />
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">{label}</p>
      <p className="mt-3 text-3xl font-bold tracking-tight text-slate-950">{value}</p>
    </div>
  );
}
