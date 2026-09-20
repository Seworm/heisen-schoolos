import Link from "next/link";
import { ArrowLeft, CircleDollarSign } from "lucide-react";
import { and, asc, eq } from "drizzle-orm";

import { db } from "@/db";
import {
  academicYears,
  classLevels,
  feeCategories,
  feeStructureItems,
  feeStructures,
  terms,
} from "@/db/schema";
import { getCurrentSchool } from "@/lib/current-school";
import FeeStructureForm from "../../new/FeeStructureForm";

export default async function EditFeeStructurePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const school = await getCurrentSchool();

  const [structure] = await db
    .select({
      id: feeStructures.id,
      name: feeStructures.name,
      description: feeStructures.description,
      academicYearId: feeStructures.academicYearId,
      termId: feeStructures.termId,
      classLevelId: feeStructures.classLevelId,
      isActive: feeStructures.isActive,
    })
    .from(feeStructures)
    .where(
      and(
        eq(feeStructures.id, id),
        eq(feeStructures.schoolId, school.id),
      ),
    )
    .limit(1);

  if (!structure) {
    return (
      <main className="p-6 lg:p-8">
        <div className="rounded-xl border bg-card p-8 text-center">
          <h1 className="text-xl font-semibold">
            Fee structure not found
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            The requested fee structure does not exist or is not
            accessible.
          </p>

          <Link
            href="/finance/fee-structures"
            className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to fee structures
          </Link>
        </div>
      </main>
    );
  }

  const [years, termsList, classes, categories, existingItems] =
    await Promise.all([
      db
        .select({
          id: academicYears.id,
          name: academicYears.name,
          isCurrent: academicYears.isCurrent,
        })
        .from(academicYears)
        .where(eq(academicYears.schoolId, school.id))
        .orderBy(asc(academicYears.startDate)),

      db
        .select({
          id: terms.id,
          name: terms.name,
          academicYearId: terms.academicYearId,
        })
        .from(terms)
        .innerJoin(
          academicYears,
          eq(academicYears.id, terms.academicYearId),
        )
        .where(eq(academicYears.schoolId, school.id))
        .orderBy(asc(terms.startDate)),

      db
        .select({
          id: classLevels.id,
          name: classLevels.name,
        })
        .from(classLevels)
        .where(eq(classLevels.schoolId, school.id))
        .orderBy(asc(classLevels.name)),

      db
        .select({
          id: feeCategories.id,
          name: feeCategories.name,
          description: feeCategories.description,
        })
        .from(feeCategories)
        .where(
          and(
            eq(feeCategories.schoolId, school.id),
            eq(feeCategories.isActive, true),
          ),
        )
        .orderBy(asc(feeCategories.name)),

      db
        .select({
          feeCategoryId: feeStructureItems.feeCategoryId,
          amount: feeStructureItems.amount,
          description: feeStructureItems.description,
        })
        .from(feeStructureItems)
        .where(eq(feeStructureItems.feeStructureId, id)),
    ]);

  return (
    <main className="space-y-8 p-6 lg:p-8">
      <section>
        <Link
          href={`/finance/fee-structures/${structure.id}`}
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to fee structure
        </Link>

        <div className="mt-5 flex items-start gap-3">
          <div className="rounded-xl bg-muted p-3">
            <CircleDollarSign className="h-6 w-6" />
          </div>

          <div>
            <h1 className="text-3xl font-semibold tracking-tight">
              Edit Fee Structure
            </h1>

            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Update the configuration and fee components for{" "}
              <span className="font-medium text-foreground">
                {structure.name}
              </span>
              .
            </p>
          </div>
        </div>
      </section>

      <FeeStructureForm
        mode="edit"
        feeStructureId={structure.id}
        initialValues={{
          name: structure.name,
          description: structure.description || "",
          academicYearId: structure.academicYearId,
          termId: structure.termId,
          classLevelId: structure.classLevelId,
          items: existingItems.map((item) => ({
            feeCategoryId: item.feeCategoryId,
            amount: item.amount,
            description: item.description || "",
          })),
        }}
        academicYears={years}
        terms={termsList}
        classLevels={classes}
        categories={categories}
      />
    </main>
  );
}