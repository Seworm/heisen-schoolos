import Link from "next/link";
import { asc, desc, eq, inArray } from "drizzle-orm";

import { db } from "@/db";
import { academicYears, terms } from "@/db/schema";
import { requireCurrentSchool } from "@/lib/current-school";

export default async function AcademicYearsPage() {
  const school = await requireCurrentSchool();

  const years = await db
    .select()
    .from(academicYears)
    .where(eq(academicYears.schoolId, school.id))
    .orderBy(desc(academicYears.startDate));

  const yearIds = years.map((year) => year.id);

  const allTerms =
    yearIds.length > 0
      ? await db
          .select()
          .from(terms)
          .where(inArray(terms.academicYearId, yearIds))
          .orderBy(
            asc(terms.academicYearId),
            asc(terms.termNumber),
          )
      : [];

  const termsByYear = new Map<
    string,
    typeof allTerms
  >();

  for (const term of allTerms) {
    const existingTerms =
      termsByYear.get(term.academicYearId) ?? [];

    existingTerms.push(term);

    termsByYear.set(
      term.academicYearId,
      existingTerms,
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-8 lg:px-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link
            href="/academics"
            className="text-sm font-medium text-slate-500 hover:text-slate-900"
          >
            ← Back to academics
          </Link>

          <h1 className="mt-4 text-2xl font-semibold tracking-tight text-slate-950">
            Academic Years
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Manage academic years and their terms for{" "}
            {school.name}.
          </p>
        </div>

        <Link
          href="/academics/years/new"
          className="inline-flex items-center justify-center rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          Add academic year
        </Link>
      </div>

      {years.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
          <h2 className="font-semibold text-slate-950">
            No academic years yet
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Create the first academic year for this school.
          </p>

          <Link
            href="/academics/years/new"
            className="mt-5 inline-flex rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white"
          >
            Create academic year
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {years.map((year) => {
            const yearTerms =
              termsByYear.get(year.id) ?? [];

            return (
              <section
                key={year.id}
                className="overflow-hidden rounded-xl border border-slate-200 bg-white"
              >
                <div className="flex flex-col gap-4 border-b border-slate-200 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <h2 className="text-lg font-semibold text-slate-950">
                        {year.name}
                      </h2>

                      {year.isCurrent && (
                        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                          Current
                        </span>
                      )}
                    </div>

                    <p className="mt-1 text-sm text-slate-500">
                      {year.startDate} → {year.endDate}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Link
                      href={`/academics/years/${year.id}`}
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                      Manage
                    </Link>

                    <Link
                      href={`/academics/years/${year.id}/terms/new`}
                      className="rounded-lg bg-slate-950 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                    >
                      Add term
                    </Link>
                  </div>
                </div>

                <div className="divide-y divide-slate-100">
                  {yearTerms.length === 0 ? (
                    <div className="px-6 py-6 text-sm text-slate-500">
                      No terms have been configured for this
                      academic year.
                    </div>
                  ) : (
                    yearTerms.map((term) => (
                      <div
                        key={term.id}
                        className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-700">
                            {term.termNumber}
                          </div>

                          <div>
                            <p className="font-medium text-slate-900">
                              {term.name}
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              {term.startDate} →{" "}
                              {term.endDate}
                            </p>
                          </div>

                          {term.isCurrent && (
                            <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                              Current term
                            </span>
                          )}
                        </div>

                        <Link
                          href={`/academics/years/${year.id}/terms/${term.id}/edit`}
                          className="text-sm font-medium text-slate-600 hover:text-slate-950"
                        >
                          Edit
                        </Link>
                      </div>
                    ))
                  )}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

