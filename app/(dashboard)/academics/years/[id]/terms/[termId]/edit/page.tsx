import Link from "next/link";
import { and, eq } from "drizzle-orm";
import { notFound } from "next/navigation";

import { db } from "@/db";
import { academicYears, terms } from "@/db/schema";
import { requireCurrentSchool } from "@/lib/current-school";

import TermEditForm from "./TermEditForm";

type PageProps = {
  params: Promise<{
    id: string;
    termId: string;
  }>;
};

export default async function EditTermPage({
  params,
}: PageProps) {
  const { id, termId } = await params;
  const school = await requireCurrentSchool();

  const [academicYear] = await db
    .select()
    .from(academicYears)
    .where(
      and(
        eq(academicYears.id, id),
        eq(academicYears.schoolId, school.id),
      ),
    )
    .limit(1);

  if (!academicYear) {
    notFound();
  }

  const [term] = await db
    .select()
    .from(terms)
    .where(
      and(
        eq(terms.id, termId),
        eq(terms.academicYearId, academicYear.id),
      ),
    )
    .limit(1);

  if (!term) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-8 lg:px-8">
      <Link
        href={`/academics/years/${academicYear.id}`}
        className="text-sm font-medium text-slate-500 hover:text-slate-900"
      >
        ← Back to {academicYear.name}
      </Link>

      <div className="mt-6">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-950">
          Edit term
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Update {term.name} for the {academicYear.name} academic
          year.
        </p>
      </div>

      <div className="mt-8 rounded-xl border border-slate-200 bg-white p-6">
        <TermEditForm
          academicYearId={academicYear.id}
          academicYearName={academicYear.name}
          academicYearStartDate={academicYear.startDate}
          academicYearEndDate={academicYear.endDate}
          termId={term.id}
          initialName={term.name}
          initialTermNumber={term.termNumber}
          initialStartDate={term.startDate}
          initialEndDate={term.endDate}
          initialIsCurrent={term.isCurrent}
        />
      </div>
    </div>
  );
}