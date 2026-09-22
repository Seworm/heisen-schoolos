import Link from "next/link";
import { asc, eq } from "drizzle-orm";

import { db } from "@/db";
import { assessmentTypes } from "@/db/schema";
import { requireCurrentSchool } from "@/lib/current-school";
import AssessmentTypeDeleteButton from "./AssessmentTypeDeleteButton";

export const dynamic = "force-dynamic";

export default async function AssessmentTypesPage() {
  const school = await requireCurrentSchool();

  const types = await db
    .select({
      id: assessmentTypes.id,
      name: assessmentTypes.name,
      code: assessmentTypes.code,
      category: assessmentTypes.category,
      description: assessmentTypes.description,
    })
    .from(assessmentTypes)
    .where(
      eq(
        assessmentTypes.schoolId,
        school.id,
      ),
    )
    .orderBy(
      asc(assessmentTypes.name),
    );

  return (
    <div className="mx-auto max-w-6xl px-6 py-8 lg:px-8">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link
            href="/assessments"
            className="text-sm font-medium text-slate-500 transition hover:text-slate-900"
          >
            ← Assessments
          </Link>

          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
            Assessment Types
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Configure the types of assessments used by the school.
          </p>
        </div>

        <Link
          href="/assessments/types/new"
          className="inline-flex items-center justify-center rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          New assessment type
        </Link>
      </div>

      {/* Empty state */}
      {types.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
            <span className="text-lg font-semibold text-slate-500">
              +
            </span>
          </div>

          <h2 className="mt-4 font-semibold text-slate-900">
            No assessment types
          </h2>

          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
            Create your first assessment type to start configuring
            assessments for this school.
          </p>

          <Link
            href="/assessments/types/new"
            className="mt-5 inline-flex rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Create assessment type
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          {/* Desktop table */}
          <div className="hidden overflow-x-auto md:block">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
                  >
                    Name
                  </th>

                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
                  >
                    Code
                  </th>

                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
                  >
                    Category
                  </th>

                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
                  >
                    Description
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500"
                  >
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {types.map((type) => (
                  <tr
                    key={type.id}
                    className="transition hover:bg-slate-50"
                  >
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">
                      {type.name}
                    </td>

                    <td className="px-6 py-4 text-sm text-slate-500">
                      {type.code ?? "—"}
                    </td>

                    <td className="px-6 py-4 text-sm text-slate-600">
                      <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium capitalize text-slate-600">
                        {type.category.replaceAll(
                          "_",
                          " ",
                        )}
                      </span>
                    </td>

                    <td className="max-w-md px-6 py-4 text-sm text-slate-500">
                      {type.description ?? "—"}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <AssessmentTypeDeleteButton id={type.id} name={type.name} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="divide-y divide-slate-100 md:hidden">
            {types.map((type) => (
              <div
                key={type.id}
                className="p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {type.name}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {type.code ?? "No code"}
                    </p>
                  </div>

                  <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium capitalize text-slate-600">
                    {type.category.replaceAll(
                      "_",
                      " ",
                    )}
                  </span>
                </div>

                {type.description && (
                  <p className="mt-3 text-sm leading-6 text-slate-500">
                    {type.description}
                  </p>
                )}
                <div className="mt-4">
                  <AssessmentTypeDeleteButton id={type.id} name={type.name} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

