import Link from "next/link";
import { and, eq } from "drizzle-orm";
import { notFound } from "next/navigation";

import { db } from "@/db";
import { academicYears } from "@/db/schema";
import { requireCurrentSchool } from "@/lib/current-school";

import AcademicYearEditForm from "./AcademicYearEditForm";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditAcademicYearPage({
  params,
}: PageProps) {
  const { id } = await params;
  const school = await requireCurrentSchool();

  const [year] = await db
    .select()
    .from(academicYears)
    .where(
      and(
        eq(academicYears.id, id),
        eq(academicYears.schoolId, school.id),
      ),
    )
    .limit(1);

  if (!year) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-8 lg:px-8">
      <Link
        href={`/academics/years/${year.id}`}
        className="text-sm font-medium text-slate-500 hover:text-slate-900"
      >
        ← Back to {year.name}
      </Link>

      <div className="mt-6">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-950">
          Edit academic year
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Update the academic year dates and status.
        </p>
      </div>

      <div className="mt-8 rounded-xl border border-slate-200 bg-white p-6">
        <AcademicYearEditForm
          academicYearId={year.id}
          initialName={year.name}
          initialStartDate={year.startDate}
          initialEndDate={year.endDate}
          initialIsCurrent={year.isCurrent}
        />
      </div>
    </div>
  );
}