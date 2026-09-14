import Link from "next/link";
import { asc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";

import { db } from "@/db";
import {
  classLevels,
  subjects,
} from "@/db/schema";
import { requireCurrentSchool } from "@/lib/current-school";
import CurriculumSubjectForm from "./CurriculumSubjectForm";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function NewClassSubjectPage({
  params,
}: Props) {
  const { id } = await params;
  const school = await requireCurrentSchool();

  const [classLevel] = await db
    .select()
    .from(classLevels)
    .where(eq(classLevels.id, id))
    .limit(1);

  if (
    !classLevel ||
    classLevel.schoolId !== school.id
  ) {
    notFound();
  }

  const subjectRows = await db
    .select({
      id: subjects.id,
      name: subjects.name,
      code: subjects.code,
    })
    .from(subjects)
    .where(eq(subjects.schoolId, school.id))
    .orderBy(asc(subjects.name));

  return (
    <div className="mx-auto max-w-2xl px-6 py-8 lg:px-8">
      <div className="mb-8">
        <Link
          href={`/academics/classes/${classLevel.id}/subjects`}
          className="text-sm font-medium text-slate-500 hover:text-slate-900"
        >
          ← Back to curriculum
        </Link>

        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-slate-950">
          Add subject
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Add a subject to the {classLevel.name} curriculum.
        </p>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <CurriculumSubjectForm
          classId={classLevel.id}
          className={classLevel.name}
          subjects={subjectRows}
        />
      </section>
    </div>
  );
}