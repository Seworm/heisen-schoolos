import Link from "next/link";
import { asc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";

import { db } from "@/db";
import { academicYears, terms } from "@/db/schema";
import { requireCurrentSchool } from "@/lib/current-school";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function AcademicYearDetailPage({
  params,
}: PageProps) {
  const { id } = await params;
  const school = await requireCurrentSchool();

  const [year] = await db
    .select()
    .from(academicYears)
    .where(
      eq(academicYears.id, id),
    )
    .limit(1);

  if (!year || year.schoolId !== school.id) {
    notFound();
  }

  const yearTerms = await db
    .select()
    .from(terms)
    .where(eq(terms.academicYearId, year.id))
    .orderBy(asc(terms.termNumber));

  return (
    <div className="mx-auto max-w-5xl px-6 py-8 lg:px-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <Link
            href="/academics/years"
            className="text-sm font-medium text-slate-500 hover:text-slate-900"
          >
            ← Back to academic years
          </Link>

          <div className="mt-5 flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-950">
              {year.name}
            </h1>

            {year.isCurrent && (
              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                Current
              </span>
            )}
          </div>

          <p className="mt-2 text-sm text-slate-500">
            {year.startDate} to {year.endDate}
          </p>
        </div>

        <div className="flex gap-2">
  <Link
    href={`/academics/years/${year.id}/edit`}
    className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
  >
    Edit year
  </Link>

  <Link
    href={`/academics/years/${year.id}/terms/new`}
    className="rounded-lg bg-slate-950 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800"
  >
    Add term
  </Link>
</div>
      </div>

      <section className="mt-8">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-slate-950">
            Terms
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Manage the academic terms and their dates.
          </p>
        </div>

        {yearTerms.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
            <h3 className="text-sm font-semibold text-slate-900">
              No terms created
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Add the first term for this academic year.
            </p>

            <Link
              href={`/academics/years/${year.id}/terms/new`}
              className="mt-5 inline-flex rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Add first term
            </Link>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="divide-y divide-slate-200">
              {yearTerms.map((term) => (
                <div
                  key={term.id}
                  className="flex items-center justify-between gap-6 px-6 py-5"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-sm font-bold text-slate-700">
                      {term.termNumber}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-slate-950">
                          {term.name}
                        </h3>

                        {term.isCurrent && (
                          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                            Current
                          </span>
                        )}
                      </div>

                      <p className="mt-1 text-sm text-slate-500">
                        {term.startDate} to {term.endDate}
                      </p>
                    </div>
                  </div>

                  <Link
                    href={`/academics/years/${year.id}/terms/${term.id}/edit`}
                    className="text-sm font-semibold text-slate-700 hover:text-slate-950"
                  >
                    Edit
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}