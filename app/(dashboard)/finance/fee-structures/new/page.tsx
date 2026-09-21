import Link from "next/link";
import { ArrowLeft, CircleDollarSign } from "lucide-react";
import { and, asc, eq } from "drizzle-orm";

import { db } from "@/db";
import {
  academicYears,
  classLevels,
  feeCategories,
  terms,
} from "@/db/schema";
import { getCurrentSchool } from "@/lib/current-school";
import FeeStructureForm from "./FeeStructureForm";

export default async function NewFeeStructurePage() {
  const school = await getCurrentSchool();

  const [years, termsList, classes, categories] = await Promise.all([
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
  ]);

  return (
    <main className="finance-page">
      <Link
        href="/finance/fee-structures"
        className="finance-breadcrumb"
      >
          <ArrowLeft className="h-4 w-4" />
          Back to fee structures
      </Link>

      <section className="finance-header">
        <div className="finance-header-content">
          <div className="finance-header-icon">
            <CircleDollarSign className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">
              Finance workflow
            </p>
            <h1 className="page-title mt-1">Create fee structure</h1>
            <p className="page-description max-w-2xl">
              Configure the fees that apply to a class for a specific
              academic year and term.
            </p>
          </div>
        </div>
      </section>

      <FeeStructureForm
        mode="create"
        academicYears={years}
        terms={termsList}
        classLevels={classes}
        categories={categories}
      />
    </main>
  );
}
