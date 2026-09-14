import Link from "next/link";
import { and, asc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import DeleteClassSubjectButton from "./DeleteClassSubjectButton";
import { db } from "@/db";
import {
  classLevels,
  classSubjects,
  subjects,
} from "@/db/schema";
import { requireCurrentSchool } from "@/lib/current-school";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ClassSubjectsPage({
  params,
}: Props) {
  const { id } = await params;
  const school = await requireCurrentSchool();

  const [classLevel] = await db
    .select()
    .from(classLevels)
    .where(
      and(
        eq(classLevels.id, id),
        eq(classLevels.schoolId, school.id),
      ),
    )
    .limit(1);

  if (!classLevel) {
    notFound();
  }

  const classSubjectRows = await db
    .select({
      id: classSubjects.id,
      subjectId: subjects.id,
      subjectName: subjects.name,
      subjectCode: subjects.code,
    })
    .from(classSubjects)
    .innerJoin(
      subjects,
      eq(classSubjects.subjectId, subjects.id),
    )
    .where(
      eq(classSubjects.classLevelId, classLevel.id),
    )
    .orderBy(asc(subjects.name));

  return (
    <div className="mx-auto max-w-5xl px-6 py-8 lg:px-8">
      <div className="mb-8">
        <Link
          href={`/academics/classes/${classLevel.id}`}
          className="text-sm font-medium text-slate-500 hover:text-slate-900"
        >
          ← Back to {classLevel.name}
        </Link>

        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-tight text-slate-950">
                {classLevel.name} Curriculum
              </h1>

              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium capitalize text-slate-600">
                {classLevel.category}
              </span>
            </div>

            <p className="mt-2 text-sm text-slate-500">
              Manage the subjects offered to this class.
            </p>
          </div>

          <Link
            href={`/academics/classes/${classLevel.id}/subjects/new`}
            className="inline-flex items-center justify-center rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Add subject
          </Link>
        </div>
      </div>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-6 py-5">
          <h2 className="font-semibold text-slate-950">
            Subjects offered
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            {classSubjectRows.length}{" "}
            {classSubjectRows.length === 1
              ? "subject"
              : "subjects"}{" "}
            configured for {classLevel.name}.
          </p>
        </div>

        {classSubjectRows.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <h3 className="font-medium text-slate-950">
              No subjects configured
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              Add subjects to define the curriculum for this
              class.
            </p>

            <Link
              href={`/academics/classes/${classLevel.id}/subjects/new`}
              className="mt-5 inline-flex rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Add subject
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {classSubjectRows.map((row) => (
              <div
  key={row.id}
  className="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between"
>
  <div>
    <p className="font-medium text-slate-900">
      {row.subjectName}
    </p>

    {row.subjectCode ? (
      <p className="mt-1 text-sm text-slate-500">
        {row.subjectCode}
      </p>
    ) : null}
  </div>

  <div className="flex items-center gap-3">
    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
      Offered
    </span>

    <DeleteClassSubjectButton
      classId={classLevel.id}
      classSubjectId={row.id}
      subjectName={row.subjectName}
    />
  </div>
</div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}