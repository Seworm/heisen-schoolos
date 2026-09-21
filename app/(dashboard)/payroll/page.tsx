import { and, asc, desc, eq } from "drizzle-orm";
import { Banknote, CheckCircle2, Users } from "lucide-react";
import { db } from "@/db";
import {
  payrollPeriods,
  payrollProfiles,
  payrollRuns,
  staff,
} from "@/db/schema";
import { getCurrentSchool } from "@/lib/current-school";
import { createPayrollPeriod, processPayroll, savePayrollProfile } from "./actions";

export const dynamic = "force-dynamic";

const money = (value: string | number) =>
  new Intl.NumberFormat("en-GH", {
    style: "currency",
    currency: "GHS",
    minimumFractionDigits: 2,
  }).format(Number(value));

export default async function PayrollPage() {
  const school = await getCurrentSchool();
  const [staffRows, periods] = await Promise.all([
    db
      .select({
        id: staff.id,
        firstName: staff.firstName,
        lastName: staff.lastName,
        staffNumber: staff.staffNumber,
        position: staff.position,
        profile: payrollProfiles,
      })
      .from(staff)
      .leftJoin(
        payrollProfiles,
        and(eq(payrollProfiles.staffId, staff.id), eq(payrollProfiles.schoolId, school.id)),
      )
      .where(and(eq(staff.schoolId, school.id), eq(staff.status, "active")))
      .orderBy(asc(staff.lastName), asc(staff.firstName)),
    db
      .select({
        id: payrollPeriods.id,
        name: payrollPeriods.name,
        periodStart: payrollPeriods.periodStart,
        periodEnd: payrollPeriods.periodEnd,
        payDate: payrollPeriods.payDate,
        status: payrollPeriods.status,
        grossTotal: payrollRuns.grossTotal,
        deductionsTotal: payrollRuns.deductionsTotal,
        netTotal: payrollRuns.netTotal,
      })
      .from(payrollPeriods)
      .leftJoin(payrollRuns, eq(payrollRuns.periodId, payrollPeriods.id))
      .where(eq(payrollPeriods.schoolId, school.id))
      .orderBy(desc(payrollPeriods.payDate)),
  ]);

  const configured = staffRows.filter((row) => row.profile).length;
  const latest = periods[0];

  return (
    <main className="mx-auto max-w-7xl space-y-7">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">People & finance</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">Payroll</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Configure staff compensation, create pay periods and produce auditable payroll runs for {school.name}.
          </p>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <span className="font-bold">{configured}/{staffRows.length}</span> active staff configured
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        <Metric icon={Users} label="Active staff" value={staffRows.length} />
        <Metric icon={CheckCircle2} label="Configured profiles" value={configured} />
        <Metric icon={Banknote} label="Latest net payroll" value={latest?.netTotal ? money(latest.netTotal) : "—"} />
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_1.95fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-bold text-slate-950">Create pay period</h2>
          <p className="mt-1 text-sm text-slate-500">Set the dates before calculating staff pay.</p>
          <form action={createPayrollPeriod} className="mt-5 space-y-3">
            <input required name="name" placeholder="September 2026 Payroll" className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm" />
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              <label className="text-xs font-semibold text-slate-600">Period starts<input required type="date" name="periodStart" className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-normal" /></label>
              <label className="text-xs font-semibold text-slate-600">Period ends<input required type="date" name="periodEnd" className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-normal" /></label>
            </div>
            <label className="block text-xs font-semibold text-slate-600">Pay date<input required type="date" name="payDate" className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-normal" /></label>
            <button className="w-full rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-800">Create draft period</button>
          </form>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-5"><h2 className="font-bold text-slate-950">Payroll periods</h2><p className="mt-1 text-sm text-slate-500">Draft periods can be calculated once every active staff member has a profile.</p></div>
          <div className="divide-y divide-slate-100">
            {periods.map((period) => (
              <div key={period.id} className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
                <div><p className="font-semibold text-slate-900">{period.name}</p><p className="mt-1 text-xs text-slate-500">{period.periodStart} — {period.periodEnd} · Pay {period.payDate}</p></div>
                <div className="flex items-center gap-4 text-right">
                  <div><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Net pay</p><p className="font-bold text-slate-900">{period.netTotal ? money(period.netTotal) : "Not processed"}</p></div>
                  {period.status === "draft" ? <form action={processPayroll}><input type="hidden" name="periodId" value={period.id} /><button className="rounded-lg bg-slate-950 px-3 py-2 text-xs font-bold text-white">Process payroll</button></form> : <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold capitalize text-emerald-700">{period.status}</span>}
                </div>
              </div>
            ))}
            {periods.length === 0 && <p className="px-5 py-12 text-center text-sm text-slate-500">No payroll periods yet.</p>}
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-5"><h2 className="font-bold text-slate-950">Staff pay profiles</h2><p className="mt-1 text-sm text-slate-500">Amounts are stored in Ghana cedis. Deductions are captured explicitly for auditability.</p></div>
        <div className="divide-y divide-slate-100">
          {staffRows.map((member) => <ProfileForm key={member.id} member={member} action={savePayrollProfile} />)}
          {staffRows.length === 0 && <p className="px-5 py-12 text-center text-sm text-slate-500">Add active staff before configuring payroll.</p>}
        </div>
      </section>
    </main>
  );
}

type StaffPayrollRow = {
  id: string;
  firstName: string;
  lastName: string;
  staffNumber: string;
  position: string | null;
  profile: {
    frequency: "monthly" | "weekly" | "hourly";
    baseSalary: string;
    allowances: string;
    taxDeduction: string;
    pensionDeduction: string;
    otherDeduction: string;
  } | null;
};

function ProfileForm({ member, action }: { member: StaffPayrollRow; action: (formData: FormData) => Promise<void> }) {
  const profile = member.profile;
  return (
    <form action={action} className="grid gap-3 px-5 py-5 lg:grid-cols-[1.3fr_0.8fr_repeat(5,minmax(90px,1fr))_auto] lg:items-end">
      <div><p className="font-semibold text-slate-900">{member.firstName} {member.lastName}</p><p className="mt-1 text-xs text-slate-500">{member.staffNumber} · {member.position || "Staff"}</p></div>
      <input type="hidden" name="staffId" value={member.id} />
      <select name="frequency" defaultValue={profile?.frequency ?? "monthly"} className="rounded-lg border border-slate-300 px-2 py-2 text-xs"><option value="monthly">Monthly</option><option value="weekly">Weekly</option><option value="hourly">Hourly</option></select>
      {([["baseSalary", "Base"], ["allowances", "Allowances"], ["taxDeduction", "Tax"], ["pensionDeduction", "Pension"], ["otherDeduction", "Other"] ] as const).map(([name, label]) => <label key={name} className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}<input name={name} type="number" min="0" step="0.01" defaultValue={profile?.[name] ?? "0"} className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-2 text-xs font-normal text-slate-900" /></label>)}
      <input type="hidden" name="bankName" value="" /><input type="hidden" name="bankAccountNumber" value="" />
      <button className="rounded-lg bg-emerald-700 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-800">Save</button>
    </form>
  );
}

function Metric({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: string | number }) {
  return <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">{label}</p><Icon className="h-4 w-4 text-emerald-600" /></div><p className="mt-3 text-3xl font-bold tracking-tight text-slate-950">{value}</p></div>;
}
