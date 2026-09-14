import Link from "next/link";
import { asc, eq } from "drizzle-orm";

import { db } from "@/db";
import { subjects } from "@/db/schema";
import { requireCurrentSchool } from "@/lib/current-school";

export default async function SubjectsPage() {
  const school = await requireCurrentSchool();

  const subjectRows = await db
    .select()
    .from(subjects)
    .where(eq(subjects.schoolId, school.id))
    .orderBy(asc(subjects.name));

  return (
    <div className="mx-auto max-w-6xl px-6 py-8 lg:px-8">
      <div className="mb-8">
        <Link
          href="/academics"
          className="text-sm font-medium text-slate-500 hover:text-slate-900"
        >
          ← Back to academics
        </Link>

        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-950">
              Subjects
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Manage the subject catalogue for{" "}
              {school.name}.
            </p>
          </div>

          <Link
            href="/academics/subjects/new"
            className="inline-flex items-center justify-center rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Add subject
          </Link>
        </div>
      </div>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-6 py-5">
          <h2 className="font-semibold text-slate-950">
            Subject catalogue
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            {subjectRows.length}{" "}
            {subjectRows.length === 1
              ? "subject"
              : "subjects"}{" "}
            configured.
          </p>
        </div>

        {subjectRows.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <h3 className="font-medium text-slate-950">
              No subjects yet
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              Create the first subject for this school.
            </p>

            <Link
              href="/academics/subjects/new"
              className="mt-5 inline-flex rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Add subject
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {subjectRows.map((subject) => (
              <div
                key={subject.id}
                className="flex flex-col gap-3 px-6 py-5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium text-slate-900">
                    {subject.name}
                  </p>

                  {subject.code ? (
                    <p className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-400">
                      {subject.code}
                    </p>
                  ) : (
                    <p className="mt-1 text-xs text-slate-400">
                      No subject code
                    </p>
                  )}
                </div>

                <Link
                  href={`/academics/subjects/${subject.id}/edit`}
                  className="text-sm font-medium text-slate-600 hover:text-slate-950"
                >
                  Edit
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}