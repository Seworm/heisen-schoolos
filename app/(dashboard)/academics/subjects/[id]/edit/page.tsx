import Link from "next/link";
import { and, eq } from "drizzle-orm";
import { notFound } from "next/navigation";

import { db } from "@/db";
import { subjects } from "@/db/schema";
import { requireCurrentSchool } from "@/lib/current-school";
import SubjectEditForm from "./SubjectEditForm";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditSubjectPage({
  params,
}: PageProps) {
  const { id } = await params;
  const school = await requireCurrentSchool();

  const [subject] = await db
    .select()
    .from(subjects)
    .where(
      and(
        eq(subjects.id, id),
        eq(subjects.schoolId, school.id),
      ),
    )
    .limit(1);

  if (!subject) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-8 lg:px-8">
      <div className="mb-8">
        <Link
          href="/academics/subjects"
          className="text-sm font-medium text-slate-500 hover:text-slate-900"
        >
          ← Back to subjects
        </Link>

        <div className="mt-4">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-950">
            Edit subject
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Update the subject details for {school.name}.
          </p>
        </div>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <SubjectEditForm subject={subject} />
      </section>
    </div>
  );
}