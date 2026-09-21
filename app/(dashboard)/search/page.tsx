import Link from "next/link";
import { and, eq, ilike, or, sql } from "drizzle-orm";
import { Search, ArrowUpRight } from "lucide-react";
import { db } from "@/db";
import { classLevels, guardians, staff, students } from "@/db/schema";
import { requireCurrentSchool } from "@/lib/current-school";

export const dynamic = "force-dynamic";

type Props = {
  searchParams?: Promise<{ q?: string }>;
};

type SearchRecord = {
  id: string;
  title: string;
  subtitle: string | null;
  meta: string | null;
  type: string;
  href: string;
};

export default async function SearchPage({ searchParams }: Props) {
  const school = await requireCurrentSchool();
  const params = await searchParams;
  const query = String(params?.q ?? "").trim();
  const pattern = `%${query}%`;

  const results = query.length >= 2
    ? await Promise.all([
        db.select({ id: students.id, title: students.firstName, subtitle: students.lastName, meta: students.studentNumber })
          .from(students)
          .where(and(eq(students.schoolId, school.id), or(ilike(students.firstName, pattern), ilike(students.lastName, pattern), ilike(students.studentNumber, pattern))))
          .limit(20),
        db.select({ id: staff.id, title: staff.firstName, subtitle: staff.lastName, meta: staff.staffNumber })
          .from(staff)
          .where(and(eq(staff.schoolId, school.id), or(ilike(staff.firstName, pattern), ilike(staff.lastName, pattern), ilike(staff.staffNumber, pattern))))
          .limit(20),
        db.select({ id: guardians.id, title: guardians.firstName, subtitle: guardians.lastName, meta: guardians.phone })
          .from(guardians)
          .where(and(eq(guardians.schoolId, school.id), or(ilike(guardians.firstName, pattern), ilike(guardians.lastName, pattern), ilike(guardians.phone, pattern))))
          .limit(20),
        db.select({ id: classLevels.id, title: classLevels.name, subtitle: sql<string | null>`${classLevels.category}`, meta: sql<string>`'Class'` })
          .from(classLevels)
          .where(and(eq(classLevels.schoolId, school.id), ilike(classLevels.name, pattern)))
          .limit(20),
      ]).then(([studentsFound, staffFound, guardiansFound, classesFound]): SearchRecord[] => [
        ...studentsFound.map((item) => ({ ...item, type: "Student", href: `/students/${item.id}` })),
        ...staffFound.map((item) => ({ ...item, type: "Staff", href: `/staff/${item.id}` })),
        ...guardiansFound.map((item) => ({ ...item, type: "Guardian", href: `/search?q=${encodeURIComponent(item.title)}` })),
        ...classesFound.map((item) => ({ ...item, type: "Class", href: `/academics/classes/${item.id}` })),
      ])
    : [];

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-gradient-to-r from-[#006b3f] to-[#003d22] px-6 py-8 text-white sm:px-8">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#fcd116]">School directory</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">Search records</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/75">Find students, staff, guardians, and classes inside {school.name}.</p>
        </div>
        <form action="/search" className="flex flex-col gap-3 p-5 sm:flex-row sm:p-6">
          <label className="flex min-w-0 flex-1 items-center gap-3 rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 focus-within:border-[#006b3f] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#006b3f]/15">
            <Search className="h-5 w-5 shrink-0 text-slate-400" />
            <input name="q" defaultValue={query} autoFocus placeholder="Student name, ID, guardian, teacher or class" className="min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400" />
          </label>
          <button className="rounded-xl bg-[#006b3f] px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#005530] focus:outline-none focus:ring-2 focus:ring-[#fcd116] focus:ring-offset-2">
            Search
          </button>
        </form>
      </section>

      {query.length >= 2 && (
        <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-6 py-4">
            <h2 className="font-bold text-slate-950">{results.length} result{results.length === 1 ? "" : "s"} for “{query}”</h2>
          </div>
          {results.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {results.map((result) => (
                <Link key={`${result.type}-${result.id}`} href={result.href} className="flex items-center justify-between gap-4 px-6 py-4 transition hover:bg-[#e8f3ed]">
                  <span>
                    <span className="block font-semibold text-slate-950">{result.title} {result.subtitle ?? ""}</span>
                    <span className="mt-1 block text-xs text-slate-500">{result.type} · {result.meta ?? "No reference"}</span>
                  </span>
                  <ArrowUpRight className="h-4 w-4 shrink-0 text-[#006b3f]" />
                </Link>
              ))}
            </div>
          ) : (
            <p className="px-6 py-12 text-center text-sm text-slate-500">No matching records found in this school.</p>
          )}
        </section>
      )}
    </main>
  );
}
