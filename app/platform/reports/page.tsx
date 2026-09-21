import { Activity, BookOpen, Building2, CreditCard, Users } from "lucide-react";
import { requireSuperAdmin } from "@/lib/authorization";
import { getPlatformReport } from "@/lib/reports/queries";

export const dynamic = "force-dynamic";

export default async function PlatformReportsPage() {
  await requireSuperAdmin();
  const report = await getPlatformReport();
  const money = new Intl.NumberFormat("en-GH", { style: "currency", currency: "GHS", maximumFractionDigits: 0 });
  return <main className="mx-auto max-w-7xl space-y-7 px-4 py-7 sm:px-6 lg:px-8">
    <header><p className="text-sm font-semibold text-violet-600">Platform intelligence</p><h1 className="mt-1 text-3xl font-bold tracking-tight">Network reports</h1><p className="mt-2 text-sm text-slate-500">Aggregated metrics across active schools. Individual tenant data remains scoped to platform administrators.</p></header>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      <Metric icon={Building2} label="Active schools" value={String(report.schoolCount)} />
      <Metric icon={Users} label="Active students" value={String(report.activeStudents)} />
      <Metric icon={Activity} label="Attendance rate" value={`${report.attendanceRate.toFixed(1)}%`} />
      <Metric icon={CreditCard} label="Collected" value={money.format(report.collected)} />
      <Metric icon={BookOpen} label="Average score" value={`${report.academicAverage.toFixed(1)}%`} />
    </div>
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-100 px-5 py-5"><h2 className="font-bold">School performance snapshot</h2><p className="mt-1 text-xs text-slate-500">Active enrollment by school</p></div><div className="divide-y divide-slate-100">{report.schools.map((school) => <div key={school.id} className="flex items-center justify-between px-5 py-4"><div><p className="font-semibold text-slate-900">{school.name}</p><p className="text-xs text-slate-500">{school.status}</p></div><p className="text-sm font-bold text-slate-700">{school.students} active students</p></div>)}</div></section>
  </main>;
}

function Metric({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><Icon className="h-5 w-5 text-violet-600" /><p className="mt-4 text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</p><p className="mt-1 text-2xl font-bold text-slate-950">{value}</p></div>;
}
