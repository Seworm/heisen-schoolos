export const dynamic = "force-dynamic";
import { and, count, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  academicYears,
  classLevels,
  staff,
  streams,
  students,
  subjects,
  terms,
} from "@/db/schema";
import { requireCurrentSchool } from "@/lib/current-school";

export default async function Home() {
  const school = await requireCurrentSchool();

  const [
    currentYearResult,
    currentTermResult,
    studentCountResult,
    staffCountResult,
    classLevelCountResult,
    streamCountResult,
    subjectCountResult,
  ] = await Promise.all([
    db
  .select()
  .from(academicYears)
  .where(
    and(
      eq(academicYears.schoolId, school.id),
      eq(academicYears.isCurrent, true),
    ),
  )
  .limit(1),

    db
  .select()
  .from(terms)
  .innerJoin(
    academicYears,
    eq(terms.academicYearId, academicYears.id),
  )
  .where(
    and(
      eq(academicYears.schoolId, school.id),
      eq(academicYears.isCurrent, true),
      eq(terms.isCurrent, true),
    ),
  )
  .limit(1),

    db
      .select({ value: count() })
      .from(students)
      .where(eq(students.schoolId, school.id)),

    db
      .select({ value: count() })
      .from(staff)
      .where(eq(staff.schoolId, school.id)),

    db
      .select({ value: count() })
      .from(classLevels)
      .where(eq(classLevels.schoolId, school.id)),

    db
      .select({ value: count() })
      .from(streams)
      .innerJoin(
        classLevels,
        eq(streams.classLevelId, classLevels.id),
      )
      .where(eq(classLevels.schoolId, school.id)),

    db
      .select({ value: count() })
      .from(subjects)
      .where(eq(subjects.schoolId, school.id)),
  ]);

  const currentYear = currentYearResult[0];
  const currentTerm = currentTermResult[0]?.terms;

  const stats = [
    {
      label: "Students",
      value: studentCountResult[0]?.value ?? 0,
    },
    {
      label: "Staff",
      value: staffCountResult[0]?.value ?? 0,
    },
    {
      label: "Class Levels",
      value: classLevelCountResult[0]?.value ?? 0,
    },
    {
      label: "Streams",
      value: streamCountResult[0]?.value ?? 0,
    },
    {
      label: "Subjects",
      value: subjectCountResult[0]?.value ?? 0,
    },
  ];

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
        <header className="mb-8">
          <p className="text-sm font-medium text-slate-500">
            SchoolOS Dashboard
          </p>

          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">
            {school.name}
          </h1>

          <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-600">
            <span>
              Academic Year:{" "}
              <strong className="font-medium text-slate-900">
                {currentYear?.name ?? "Not set"}
              </strong>
            </span>

            <span>
              Term:{" "}
              <strong className="font-medium text-slate-900">
                {currentTerm?.name ?? "Not set"}
              </strong>
            </span>
          </div>
        </header>

        <section
          aria-label="School statistics"
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5"
        >
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-slate-200 bg-white p-5"
            >
              <p className="text-sm font-medium text-slate-500">
                {stat.label}
              </p>

              <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
                {stat.value}
              </p>
            </div>
          ))}
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <h2 className="text-base font-semibold text-slate-950">
              Academic structure
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              The foundational structure currently configured for this school.
            </p>

            <div className="mt-6 space-y-4 text-sm">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="text-slate-600">Class levels</span>
                <span className="font-medium text-slate-950">
                  {classLevelCountResult[0]?.value ?? 0}
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="text-slate-600">Streams</span>
                <span className="font-medium text-slate-950">
                  {streamCountResult[0]?.value ?? 0}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-600">Subjects</span>
                <span className="font-medium text-slate-950">
                  {subjectCountResult[0]?.value ?? 0}
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <h2 className="text-base font-semibold text-slate-950">
              System status
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Current development environment.
            </p>

            <div className="mt-6 space-y-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Database</span>
                <span className="font-medium text-emerald-700">
                  Connected
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-600">School context</span>
                <span className="font-medium text-emerald-700">
                  Active
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-600">Authentication</span>
                <span className="font-medium text-amber-700">
                  Development mode
                </span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}