import { asc, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { academicYears, scholarships, studentScholarships, students, terms } from "@/db/schema";
import { getCurrentSchool } from "@/lib/current-school";
import { createScholarshipAction, assignScholarshipAction } from "./actions";

const input = "rounded-lg border bg-background px-3 py-2 text-sm";

export default async function ScholarshipsPage() {
  const school = await getCurrentSchool();
  const [programs, studentsRows, years, assignments] = await Promise.all([
    db.select().from(scholarships).where(eq(scholarships.schoolId, school.id)).orderBy(asc(scholarships.name)),
    db.select({ id: students.id, name: students.firstName, lastName: students.lastName, number: students.studentNumber }).from(students).where(eq(students.schoolId, school.id)).orderBy(asc(students.lastName)),
    db.select({ id: academicYears.id, name: academicYears.name }).from(academicYears).where(eq(academicYears.schoolId, school.id)).orderBy(desc(academicYears.startDate)),
    db.select({ id: studentScholarships.id, studentId: studentScholarships.studentId, scholarshipId: studentScholarships.scholarshipId, amount: studentScholarships.amount, year: academicYears.name, term: terms.name }).from(studentScholarships).innerJoin(students, eq(students.id, studentScholarships.studentId)).innerJoin(scholarships, eq(scholarships.id, studentScholarships.scholarshipId)).innerJoin(academicYears, eq(academicYears.id, studentScholarships.academicYearId)).innerJoin(terms, eq(terms.id, studentScholarships.termId)).where(eq(studentScholarships.schoolId, school.id)).orderBy(desc(studentScholarships.createdAt)).limit(100),
  ]);
  const termsForYear = years.length ? await db.select({ id: terms.id, name: terms.name, academicYearId: terms.academicYearId }).from(terms).where(eq(terms.academicYearId, years[0].id)).orderBy(asc(terms.termNumber)) : [];
  return <main className="mx-auto max-w-6xl space-y-8 p-6 lg:p-8">
    <header><p className="text-sm text-muted-foreground">Finance</p><h1 className="text-3xl font-semibold">Scholarships & financial aid</h1><p className="mt-2 text-sm text-muted-foreground">Define aid programs and assign term-specific support to students.</p></header>
    <section className="grid gap-6 lg:grid-cols-2">
      <form action={createScholarshipAction} className="space-y-3 rounded-xl border bg-card p-6"><h2 className="font-semibold">Create scholarship</h2><input name="name" required maxLength={150} placeholder="Scholarship name" className={`${input} w-full`} /><input name="percentage" required type="number" min="0" max="100" step="0.01" placeholder="Discount percentage" className={`${input} w-full`} /><input name="maxAmount" type="number" min="0.01" step="0.01" placeholder="Maximum award (optional)" className={`${input} w-full`} /><button className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Create scholarship</button></form>
      <form action={assignScholarshipAction} className="space-y-3 rounded-xl border bg-card p-6"><h2 className="font-semibold">Assign financial aid</h2><select name="scholarshipId" required className={`${input} w-full`}><option value="">Scholarship</option>{programs.map((item) => <option key={item.id} value={item.id}>{item.name} ({item.percentage}%)</option>)}</select><select name="studentId" required className={`${input} w-full`}><option value="">Student</option>{studentsRows.map((student) => <option key={student.id} value={student.id}>{student.lastName}, {student.name} ({student.number})</option>)}</select><select name="academicYearId" required className={`${input} w-full`} defaultValue={years[0]?.id}>{years.map((year) => <option key={year.id} value={year.id}>{year.name}</option>)}</select><select name="termId" required className={`${input} w-full`}>{termsForYear.map((term) => <option key={term.id} value={term.id}>{term.name}</option>)}</select><input name="amount" type="number" min="0.01" step="0.01" placeholder="Fixed award (optional; overrides percentage)" className={`${input} w-full`} /><button className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white">Assign aid</button></form>
    </section>
    <section className="overflow-hidden rounded-xl border bg-card"><div className="border-b px-5 py-4"><h2 className="font-semibold">Assigned aid</h2></div><div className="divide-y">{assignments.map((assignment) => <div key={assignment.id} className="flex flex-wrap justify-between gap-2 px-5 py-4 text-sm"><span>{studentsRows.find((student) => student.id === assignment.studentId)?.lastName || "Student"} · {programs.find((program) => program.id === assignment.scholarshipId)?.name || "Scholarship"}</span><span>{assignment.year} · {assignment.term} · {assignment.amount ? `GHS ${Number(assignment.amount).toFixed(2)} fixed` : "Percentage award"}</span></div>)}{!assignments.length && <p className="p-8 text-center text-sm text-muted-foreground">No financial aid assignments yet.</p>}</div></section>
  </main>;
}
