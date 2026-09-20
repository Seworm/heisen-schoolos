import Link from "next/link";
import { asc, eq } from "drizzle-orm";

import { db } from "@/db";
import {
  academicYears,
  assessmentPeriods,
  terms,
} from "@/db/schema";
import { requireCurrentSchool } from "@/lib/current-school";

export const dynamic = "force-dynamic";

export default async function AssessmentPeriodsPage() {
  const school =
    await requireCurrentSchool();

  const periods = await db
    .select({
      id: assessmentPeriods.id,
      name: assessmentPeriods.name,
      status: assessmentPeriods.status,
      startDate: assessmentPeriods.startDate,
      endDate: assessmentPeriods.endDate,
      academicYearName:
        academicYears.name,
      termName: terms.name,
    })
    .from(assessmentPeriods)
    .innerJoin(
      academicYears,
      eq(
        assessmentPeriods.academicYearId,
        academicYears.id,
      ),
    )
    .innerJoin(
      terms,
      eq(
        assessmentPeriods.termId,
        terms.id,
      ),
    )
    .where(
      eq(
        assessmentPeriods.schoolId,
        school.id,
      ),
    )
    .orderBy(
      asc(academicYears.startDate),
      asc(terms.termNumber),
      asc(assessmentPeriods.name),
    );

  return (
    <div className="mx-auto max-w-6xl px-6 py-8 lg:px-8">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <Link
            href="/assessments"
            className="text-sm text-slate-500 hover:text-slate-900"
          >
            ← Assessments
          </Link>

          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
            Assessment Periods
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Organise assessments within academic terms.
          </p>
        </div>

        <Link
          href="/assessments/periods/new"
          className="rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
        >
          New period
        </Link>
      </div>

      {periods.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-10 text-center">
          <h2 className="font-semibold text-slate-900">
            No assessment periods
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Create an assessment period before creating assessments.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Period
                </th>

                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Academic year
                </th>

                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Term
                </th>

                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Status
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {periods.map((period) => (
                <tr key={period.id}>
                  <td className="px-6 py-4 text-sm font-medium text-slate-900">
                    {period.name}
                  </td>

                  <td className="px-6 py-4 text-sm text-slate-500">
                    {period.academicYearName}
                  </td>

                  <td className="px-6 py-4 text-sm text-slate-500">
                    {period.termName}
                  </td>

                  <td className="px-6 py-4">
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium capitalize text-slate-600">
                      {period.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}


