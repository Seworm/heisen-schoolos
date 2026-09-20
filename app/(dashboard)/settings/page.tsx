import { eq } from "drizzle-orm";
import { db } from "@/db";
import { schoolSettings } from "@/db/schema";
import { getCurrentSchool } from "@/lib/current-school";

export const dynamic = "force-dynamic";
export default async function SettingsPage() {
  const school = await getCurrentSchool();
  const [settings] = await db.select().from(schoolSettings).where(eq(schoolSettings.schoolId, school.id)).limit(1);
  return <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8"><p className="text-sm text-slate-500">Configuration</p><h1 className="text-3xl font-semibold tracking-tight">School settings</h1><p className="mt-1 text-sm text-slate-500">Operational settings used by finance, results and report cards.</p><div className="mt-7 grid gap-4 md:grid-cols-2"><Setting label="Currency" value={settings?.currency ?? "GHS"}/><Setting label="Timezone" value={settings?.timezone ?? "Africa/Accra"}/><Setting label="Overall ranking" value={settings?.enableRanking ? "Enabled" : "Disabled"}/><Setting label="Subject ranking" value={settings?.enableSubjectRanking ? "Enabled" : "Disabled"}/><Setting label="Overpayments" value={settings?.allowOverpayment ? "Allowed" : "Blocked"}/><Setting label="Next reopening date" value={settings?.nextTermReopeningDate ?? "Not configured"}/></div></main>;
}
function Setting({ label, value }: { label: string; value: string }) { return <div className="rounded-xl border border-slate-200 bg-white p-5"><p className="text-sm text-slate-500">{label}</p><p className="mt-2 font-medium text-slate-950">{value}</p></div>; }


