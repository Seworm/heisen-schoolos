import Link from "next/link";
import { asc, and, eq } from "drizzle-orm";
import { db } from "@/db";
import { academicYears, classLevels, feedingFeeSettings } from "@/db/schema";
import { getCurrentSchool } from "@/lib/current-school";
import { saveFeedingSettingAction } from "./actions";

export default async function FeedingFeesPage() {
  const school = await getCurrentSchool();
  const [years, classes, settings] = await Promise.all([
    db.select({ id: academicYears.id, name: academicYears.name }).from(academicYears).where(eq(academicYears.schoolId, school.id)).orderBy(asc(academicYears.startDate)),
    db.select({ id: classLevels.id, name: classLevels.name }).from(classLevels).where(eq(classLevels.schoolId, school.id)).orderBy(asc(classLevels.sortOrder)),
    db.select({ id: feedingFeeSettings.id, academicYearId: feedingFeeSettings.academicYearId, classLevelId: feedingFeeSettings.classLevelId, dailyAmount: feedingFeeSettings.dailyAmount, termlyAmount: feedingFeeSettings.termlyAmount }).from(feedingFeeSettings).where(and(eq(feedingFeeSettings.schoolId, school.id), eq(feedingFeeSettings.active, true))),
  ]);
  return <main className="mx-auto max-w-6xl space-y-8 p-6 lg:p-8">
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div><p className="text-sm text-muted-foreground">Finance</p><h1 className="text-3xl font-semibold">Feeding fees</h1><p className="mt-2 text-sm text-muted-foreground">Set class-level rates and record daily payments for students configured for daily payment.</p></div>
      <div className="flex flex-wrap gap-2"><Link href="/finance/feeding/collect" className="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground">Record daily collection</Link><a href="/finance/feeding/export" className="rounded-lg border px-4 py-2.5 text-sm font-medium">Export collections CSV</a></div>
    </header>
    <section className="rounded-xl border bg-card p-6">
      <h2 className="font-semibold">Set feeding fee by class</h2>
      <form action={saveFeedingSettingAction} className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <select name="academicYearId" required className="rounded-lg border bg-background px-3 py-2">{years.map((year) => <option key={year.id} value={year.id}>{year.name}</option>)}</select>
        <select name="classLevelId" required className="rounded-lg border bg-background px-3 py-2">{classes.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
        <input name="dailyAmount" type="number" min="0.01" step="0.01" required placeholder="Daily amount" className="rounded-lg border bg-background px-3 py-2" />
        <input name="termlyAmount" type="number" min="0.01" step="0.01" placeholder="Optional termly amount" className="rounded-lg border bg-background px-3 py-2" />
        <button className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Save rate</button>
      </form>
    </section>
    <section className="overflow-hidden rounded-xl border bg-card">
      <div className="border-b px-5 py-4"><h2 className="font-semibold">Configured rates</h2></div>
      <div className="divide-y">{settings.length === 0 ? <p className="p-6 text-sm text-muted-foreground">No feeding rates configured.</p> : settings.map((setting) => <div key={setting.id} className="flex justify-between px-5 py-4 text-sm"><span>{classes.find((item) => item.id === setting.classLevelId)?.name} · {years.find((year) => year.id === setting.academicYearId)?.name}</span><span>GHS {setting.dailyAmount} daily{setting.termlyAmount ? ` · GHS ${setting.termlyAmount} termly` : ""}</span></div>)}</div>
    </section>
  </main>;
}
