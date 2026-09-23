import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { academicYears, students } from "@/db/schema";
import { getCurrentSchool } from "@/lib/current-school";
import { collectDailyFeedingFeeAction, setStudentFeedingModeAction } from "../actions";

export default async function CollectFeedingFeePage() {
  const school = await getCurrentSchool();
  const [years, studentRows] = await Promise.all([
    db.select({ id: academicYears.id, name: academicYears.name }).from(academicYears).where(eq(academicYears.schoolId, school.id)).orderBy(asc(academicYears.startDate)),
    db.select({ id: students.id, name: students.firstName, lastName: students.lastName, studentNumber: students.studentNumber }).from(students).where(and(eq(students.schoolId, school.id), eq(students.status, "active"))).orderBy(asc(students.lastName), asc(students.firstName)),
  ]);
  return <main className="mx-auto max-w-2xl space-y-6 p-6 lg:p-8">
    <div><p className="text-sm text-muted-foreground">Finance / Feeding fees</p><h1 className="text-3xl font-semibold">Record daily collection</h1><p className="mt-2 text-sm text-muted-foreground">Only students assigned the daily feeding payment mode can be recorded.</p></div>
    <form action={collectDailyFeedingFeeAction} className="space-y-4 rounded-xl border bg-card p-6">
      <select name="academicYearId" required className="w-full rounded-lg border bg-background px-3 py-2">{years.map((year) => <option key={year.id} value={year.id}>{year.name}</option>)}</select>
      <select name="studentId" required className="w-full rounded-lg border bg-background px-3 py-2">{studentRows.map((student) => <option key={student.id} value={student.id}>{student.lastName}, {student.name} · {student.studentNumber}</option>)}</select>
      <input name="collectionDate" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} className="w-full rounded-lg border bg-background px-3 py-2" />
      <input name="amount" type="number" min="0.01" step="0.01" required placeholder="Amount collected" className="w-full rounded-lg border bg-background px-3 py-2" />
      <select name="method" className="w-full rounded-lg border bg-background px-3 py-2"><option value="cash">Cash</option><option value="mobile_money">Mobile money</option><option value="bank_transfer">Bank transfer</option><option value="card">Card</option><option value="other">Other</option></select>
      <input name="receiptNumber" required placeholder="Receipt number" className="w-full rounded-lg border bg-background px-3 py-2" />
      <textarea name="notes" placeholder="Notes (optional)" className="min-h-20 w-full rounded-lg border bg-background px-3 py-2" />
      <button className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground">Save collection</button>
    </form>
    <section className="rounded-xl border bg-card p-6">
      <h2 className="font-semibold">Set a student&apos;s feeding payment mode</h2>
      <p className="mt-1 text-sm text-muted-foreground">This is restricted to school finance and administration staff.</p>
      <form action={setStudentFeedingModeAction} className="mt-4 grid gap-3 sm:grid-cols-3">
        <select name="academicYearId" required className="rounded-lg border bg-background px-3 py-2">{years.map((year) => <option key={year.id} value={year.id}>{year.name}</option>)}</select>
        <select name="studentId" required className="rounded-lg border bg-background px-3 py-2">{studentRows.map((student) => <option key={student.id} value={student.id}>{student.lastName}, {student.name}</option>)}</select>
        <select name="mode" className="rounded-lg border bg-background px-3 py-2"><option value="daily">Daily</option><option value="termly">Termly</option></select>
        <button className="rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground sm:col-span-3">Save student mode</button>
      </form>
    </section>
  </main>;
}
