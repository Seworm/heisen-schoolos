import Link from "next/link";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";

import { db } from "@/db";
import { academicYears } from "@/db/schema";
import { requireCurrentSchool } from "@/lib/current-school";

import TermForm from "./TermForm";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function NewTermPage({
  params,
}: PageProps) {
  const { id } = await params;
  const school = await requireCurrentSchool();

  const [year] = await db
    .select()
    .from(academicYears)
    .where(eq(academicYears.id, id))
    .limit(1);

  if (!year || year.schoolId !== school.id) {
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
          Add term
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Create a term for the {year.name} academic year.
        </p>
      </div>

      <div className="mt-8 rounded-xl border border-slate-200 bg-white p-6">
        <TermForm
          academicYearId={year.id}
          academicYearName={year.name}
          academicYearStartDate={year.startDate}
          academicYearEndDate={year.endDate}
        />
      </div>
    </div>
  );
}