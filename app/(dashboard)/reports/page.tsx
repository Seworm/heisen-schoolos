import Link from "next/link";
import { Activity, ArrowRight, BarChart3, BookOpen, CreditCard, Users } from "lucide-react";
import { requireCurrentSchool } from "@/lib/current-school";
import { requireTeacherScope } from "@/lib/authorization";
import { getSchoolReport } from "@/lib/reports/queries";
import { getSchoolInsights } from "@/lib/insights";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const school = await requireCurrentSchool();
  await requireTeacherScope(school.id);
  const [report, insights] = await Promise.all([getSchoolReport(school.id), getSchoolInsights(school.id)]);
  const money = new Intl.NumberFormat("en-GH", { style: "currency", currency: "GHS", maximumFractionDigits: 0 });

  return (
    <main className="space-y-7">
      <header>
        <p className="text-sm font-semibold text-blue-600">Insights</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">School reports</h1>
        <p className="mt-2 text-sm text-slate-500">A current view of {school.name}&apos;s enrollment, attendance, finance and outcomes.</p>
      </header>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric icon={Users} label="Active enrollment" value={String(report.enrollment.active)} detail={`${report.enrollment.newThisYear} admitted this year`} />
        <Metric icon={Activity} label="Attendance rate" value={`${report.attendance.rate.toFixed(1)}%`} detail={`${report.attendance.sessions} sessions recorded`} />
        <Metric icon={CreditCard} label="Collected (12 months)" value={money.format(report.finance.collected)} detail={`${money.format(report.finance.invoiced)} invoiced`} />
        <Metric icon={BookOpen} label="Average score" value={`${report.academics.average.toFixed(1)}%`} detail={`${report.academics.assessments} published assessments`} />
      </div>
      <section className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between"><div><h2 className="font-bold text-slate-950">Enrollment trend</h2><p className="mt-1 text-xs text-slate-500">New admissions over the last six months</p></div><BarChart3 className="h-5 w-5 text-blue-600" /></div>
          <div className="mt-6 flex h-40 items-end gap-3">
            {report.enrollmentTrend.map((point) => <div key={point.month} className="flex flex-1 flex-col items-center gap-2"><div className="w-full rounded-t-md bg-blue-500" style={{ height: `${Math.max(8, Math.min(100, point.value * 14))}%` }} title={`${point.value} admissions`} /><span className="text-[11px] text-slate-400">{point.month}</span></div>)}
            {report.enrollmentTrend.length === 0 && <p className="w-full self-center text-center text-sm text-slate-500">No admissions recorded in this period.</p>}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="font-bold text-slate-950">Explore detail</h2>
          <p className="mt-1 text-sm text-slate-500">Use operational workspaces for the underlying records.</p>
          <div className="mt-5 space-y-2">
            {[
              ["/attendance", "Attendance registers"],
              ["/finance", "Invoices and payments"],
              ["/assessments/results", "Assessment results"],
            ].map(([href, label]) => <Link key={href} href={href} className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">{label}<ArrowRight className="h-4 w-4 text-slate-400" /></Link>)}
          </div>
        </div>
      </section>
      <section className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4"><div><h2 className="font-bold text-slate-950">Academic risk indicators</h2><p className="mt-1 text-xs text-slate-500">Signals are private to this school and use your configured thresholds.</p></div><span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">{insights.summary.atRiskStudents + insights.summary.watchStudents} flagged</span></div>
          <div className="mt-5 grid grid-cols-2 gap-3"><InsightStat label="High priority" value={insights.summary.atRiskStudents} tone="rose" /><InsightStat label="Watch list" value={insights.summary.watchStudents} tone="amber" /></div>
          <div className="mt-5 space-y-2">{insights.risks.slice(0, 6).map((risk) => <div key={risk.id} className="flex items-center justify-between rounded-xl border border-slate-100 px-3 py-2.5"><div><p className="text-sm font-semibold text-slate-800">{risk.name}</p><p className="text-xs text-slate-500">{risk.factors.join(" · ")}</p></div><span className={`text-xs font-bold ${risk.level === "high" ? "text-rose-600" : "text-amber-600"}`}>{risk.level === "high" ? "High" : "Watch"}</span></div>)}</div>
          {insights.risks.length === 0 && <p className="mt-5 text-sm text-emerald-600">No students currently meet the configured risk indicators.</p>}
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="font-bold text-slate-950">Outcome trend</h2><p className="mt-1 text-xs text-slate-500">Published and closed assessment averages.</p><div className="mt-5 space-y-3">{insights.trends.map((trend) => <div key={trend.month} className="flex items-center gap-3"><span className="w-8 text-xs text-slate-400">{trend.month}</span><div className="h-2 flex-1 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-blue-500" style={{ width: `${Math.min(100, Math.max(0, trend.average))}%` }} /></div><span className="w-12 text-right text-xs font-semibold text-slate-600">{trend.average.toFixed(0)}%</span></div>)}</div><p className="mt-6 text-xs text-slate-500">{insights.summary.recentCommunications} communications published in the last 30 days.</p></div>
      </section>
    </main>
  );
}

function Metric({ icon: Icon, label, value, detail }: { icon: React.ElementType; label: string; value: string; detail: string }) {
  return <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><Icon className="h-5 w-5 text-blue-600" /><p className="mt-4 text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</p><p className="mt-1 text-2xl font-bold text-slate-950">{value}</p><p className="mt-1 text-xs text-slate-500">{detail}</p></div>;
}

function InsightStat({ label, value, tone }: { label: string; value: number; tone: "rose" | "amber" }) {
  return <div className={`rounded-xl p-4 ${tone === "rose" ? "bg-rose-50" : "bg-amber-50"}`}><p className="text-xs font-semibold text-slate-500">{label}</p><p className={`mt-1 text-2xl font-bold ${tone === "rose" ? "text-rose-700" : "text-amber-700"}`}>{value}</p></div>;
}
