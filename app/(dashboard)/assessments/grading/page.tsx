import Link from "next/link";
import { desc, eq } from "drizzle-orm";

import { db } from "@/db";
import {
  assessmentTypes,
  gradingSchemes,
} from "@/db/schema";
import { requireCurrentSchool } from "@/lib/current-school";

export default async function GradingPage() {
  const school = await requireCurrentSchool();

  const schemes = await db
    .select()
    .from(gradingSchemes)
    .where(eq(gradingSchemes.schoolId, school.id))
    .orderBy(desc(gradingSchemes.createdAt));

  const assessmentTypeRows = await db
    .select()
    .from(assessmentTypes)
    .where(eq(assessmentTypes.schoolId, school.id))
    .orderBy(assessmentTypes.name);

  return (
    <main className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-blue-600">
            Assessments
          </p>

          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">
            Grading schemes
          </h1>

          <p className="mt-2 max-w-2xl text-sm text-slate-500">
            Configure how assessment components are weighted and how
            final percentages are converted into grades.
          </p>
        </div>

        <Link
          href="/assessments/grading/new"
          className="inline-flex items-center justify-center rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          Create grading scheme
        </Link>
      </div>

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Schemes
          </p>

          <p className="mt-2 text-3xl font-bold text-slate-950">
            {schemes.length}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Assessment types
          </p>

          <p className="mt-2 text-3xl font-bold text-slate-950">
            {assessmentTypeRows.length}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Active schemes
          </p>

          <p className="mt-2 text-3xl font-bold text-emerald-600">
            {
              schemes.filter(
                (scheme) => scheme.status === "active",
              ).length
            }
          </p>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-5">
          <h2 className="font-semibold text-slate-950">
            Grading schemes
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Manage the grading structures used by this school.
          </p>
        </div>

        {schemes.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="font-semibold text-slate-900">
              No grading schemes yet
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Create the first grading scheme to configure assessment
              weights and grade bands.
            </p>

            <Link
              href="/assessments/grading/new"
              className="mt-5 inline-flex rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white"
            >
              Create grading scheme
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {schemes.map((scheme) => (
              <div
                key={scheme.id}
                className="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-slate-950">
                      {scheme.name}
                    </h3>

                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        scheme.status === "active"
                          ? "bg-emerald-50 text-emerald-700"
                          : scheme.status === "archived"
                            ? "bg-slate-100 text-slate-600"
                            : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {scheme.status}
                    </span>
                  </div>

                  <p className="mt-1 text-sm text-slate-500">
                    {scheme.description ||
                      "No description provided."}
                  </p>
                </div>

                <Link
                  href={`/assessments/grading/${scheme.id}`}
                  className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Manage
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}