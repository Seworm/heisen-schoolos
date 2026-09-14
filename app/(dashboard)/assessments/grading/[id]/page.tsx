import Link from "next/link";
import { and, asc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";

import { db } from "@/db";
import {
  assessmentTypes,
  gradeBands,
  gradingSchemeItems,
  gradingSchemes,
} from "@/db/schema";
import { requireCurrentSchool } from "@/lib/current-school";

import GradingSchemeEditor from "./GradingSchemeEditor";
import GradingSchemeLifecycle from "./GradingSchemeLifecycle";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function GradingSchemePage({
  params,
}: Props) {
  const { id } = await params;

  const school = await requireCurrentSchool();

  const [scheme] = await db
    .select()
    .from(gradingSchemes)
    .where(
      and(
        eq(gradingSchemes.id, id),
        eq(gradingSchemes.schoolId, school.id),
      ),
    )
    .limit(1);

  if (!scheme) {
    notFound();
  }

  const assessmentTypeRows = await db
    .select()
    .from(assessmentTypes)
    .where(eq(assessmentTypes.schoolId, school.id))
    .orderBy(asc(assessmentTypes.name));

  const itemRows = await db
    .select({
      id: gradingSchemeItems.id,
      assessmentTypeId:
        gradingSchemeItems.assessmentTypeId,
      weightPercent:
        gradingSchemeItems.weightPercent,
    })
    .from(gradingSchemeItems)
    .where(
      eq(
        gradingSchemeItems.gradingSchemeId,
        scheme.id,
      ),
    )
    .orderBy(asc(gradingSchemeItems.createdAt));

  const bandRows = await db
    .select({
      id: gradeBands.id,
      grade: gradeBands.grade,
      label: gradeBands.label,
      minimumPercent:
        gradeBands.minimumPercent,
      maximumPercent:
        gradeBands.maximumPercent,
      remark: gradeBands.remark,
      sortOrder: gradeBands.sortOrder,
    })
    .from(gradeBands)
    .where(
      eq(
        gradeBands.gradingSchemeId,
        scheme.id,
      ),
    )
    .orderBy(
      asc(gradeBands.sortOrder),
      asc(gradeBands.minimumPercent),
    );

  const items = itemRows.map((item) => ({
    id: item.id,
    assessmentTypeId:
      item.assessmentTypeId,
    weightPercent: Number(
      item.weightPercent,
    ),
  }));

  const bands = bandRows.map((band) => ({
    id: band.id,
    grade: band.grade,
    label: band.label ?? "",
    minimumPercent: Number(
      band.minimumPercent,
    ),
    maximumPercent: Number(
      band.maximumPercent,
    ),
    remark: band.remark ?? "",
    sortOrder: band.sortOrder,
  }));

  return (
    <main className="space-y-8">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <Link
            href="/assessments/grading"
            className="text-sm font-medium text-slate-500 transition hover:text-slate-900"
          >
            ← Grading schemes
          </Link>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-slate-950">
              {scheme.name}
            </h1>

            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                scheme.status === "active"
                  ? "bg-emerald-50 text-emerald-700"
                  : scheme.status === "archived"
                    ? "bg-slate-100 text-slate-600"
                    : "bg-amber-50 text-amber-700"
              }`}
            >
              {scheme.status}
            </span>
          </div>

          <p className="mt-2 max-w-2xl text-sm text-slate-500">
            Configure assessment weights and grade bands for this
            grading scheme.
          </p>
        </div>

        <GradingSchemeLifecycle
          schemeId={scheme.id}
          status={scheme.status}
        />
      </div>

      <GradingSchemeEditor
        schemeId={scheme.id}
        schemeStatus={scheme.status}
        assessmentTypes={assessmentTypeRows.map(
          (type) => ({
            id: type.id,
            name: type.name,
            category: type.category,
          }),
        )}
        initialItems={items}
        initialBands={bands}
      />
    </main>
  );
}