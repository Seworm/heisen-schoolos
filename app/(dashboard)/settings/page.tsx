import { eq } from "drizzle-orm";
import { db } from "@/db";
import { schoolSettings } from "@/db/schema";
import { getCurrentSchool } from "@/lib/current-school";
import { getInsightThresholds } from "@/lib/insights";
import { updateInsightThresholds } from "./actions";

export const dynamic = "force-dynamic";
export default async function SettingsPage() {
  const school = await getCurrentSchool();
  const [settings] = await db.select().from(schoolSettings).where(eq(schoolSettings.schoolId, school.id)).limit(1);
  const thresholds = await getInsightThresholds(school.id);
  return <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8"><p className="text-sm text-slate-500">Configuration</p><h1 className="text-3xl font-semibold tracking-tight">School settings</h1><p className="mt-1 text-sm text-slate-500">Operational settings used by finance, results and report cards.</p><div className="mt-7 grid gap-4 md:grid-cols-2"><Setting label="Currency" value={settings?.currency ?? "GHS"}/><Setting label="Timezone" value={settings?.timezone ?? "Africa/Accra"}/><Setting label="Overall ranking" value={settings?.enableRanking ? "Enabled" : "Disabled"}/><Setting label="Subject ranking" value={settings?.enableSubjectRanking ? "Enabled" : "Disabled"}/><Setting label="Overpayments" value={settings?.allowOverpayment ? "Allowed" : "Blocked"}/><Setting label="Next reopening date" value={settings?.nextTermReopeningDate ?? "Not configured"}/></div><section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6"><h2 className="font-bold text-slate-950">Insight thresholds</h2><p className="mt-1 text-sm text-slate-500">Used to identify students who may need timely support. Only school administrators can save changes.</p><form action={updateInsightThresholds} className="mt-5 grid gap-4 sm:grid-cols-2"><Field name="attendanceRate" label="Attendance watch below (%)" value={thresholds.attendanceRate}/><Field name="assessmentAverage" label="Academic watch below (%)" value={thresholds.assessmentAverage}/><Field name="minimumAssessments" label="Minimum assessments" value={thresholds.minimumAssessments}/><Field name="lookbackMonths" label="Lookback window (months)" value={thresholds.lookbackMonths}/><button className="rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 sm:col-span-2 sm:w-fit" type="submit">Save thresholds</button></form></section></main>;
}
function Setting({ label, value }: { label: string; value: string }) { return <div className="rounded-xl border border-slate-200 bg-white p-5"><p className="text-sm text-slate-500">{label}</p><p className="mt-2 font-medium text-slate-950">{value}</p></div>; }
function Field({ name, label, value }: { name: string; label: string; value: number }) { return <label className="text-sm font-medium text-slate-700">{label}<input name={name} type="number" min="0" step="1" defaultValue={value} className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2" /></label>; }

