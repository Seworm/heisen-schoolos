import Link from "next/link";
import { asc, eq } from "drizzle-orm";

import { db } from "@/db";
import {
  academicYears,
  terms,
} from "@/db/schema";
import { requireCurrentSchool } from "@/lib/current-school";

import AssessmentPeriodForm from "../AssessmentPeriodForm";

export const dynamic = "force-dynamic";

export default async function NewAssessmentPeriodPage() {
  const school =
    await requireCurrentSchool();

  const years = await db
    .select({
      id: academicYears.id,
      name: academicYears.name,
    })
    .from(academicYears)
    .where(
      eq(
        academicYears.schoolId,
        school.id,
      ),
    )
    .orderBy(
      asc(academicYears.startDate),
    );

  const allTerms = await db
    .select({
      id: terms.id,
      name: terms.name,
      academicYearId:
        terms.academicYearId,
    })
    .from(terms)
    .innerJoin(
      academicYears,
      eq(
        terms.academicYearId,
        academicYears.id,
      ),
    )
    .where(
      eq(
        academicYears.schoolId,
        school.id,
      ),
    )
    .orderBy(
      asc(terms.termNumber),
    );

  return (
    <div className="mx-auto max-w-2xl px-6 py-8 lg:px-8">
      <Link
        href="/assessments/periods"
        className="text-sm text-slate-500 hover:text-slate-900"
      >
        ← Assessment periods
      </Link>

      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-8">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-950">
          New assessment period
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Create a period for organising assessments within a term.
        </p>

        <div className="mt-8">
          <AssessmentPeriodForm
            academicYears={years}
            terms={allTerms}
          />
        </div>
      </div>
    </div>
  );
}