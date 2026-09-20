import Link from "next/link";
import {
  ArrowLeft,
  CircleDollarSign,
  Edit3,
  FileText,
  Power,
} from "lucide-react";
import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import {
  academicYears,
  feeCategories,
  feeStructureItems,
  feeStructures,
  classLevels,
  terms,
} from "@/db/schema";
import { getCurrentSchool } from "@/lib/current-school";
import { toggleFeeStructureAction } from "../../actions";

function formatMoney(value: string | number | null) {
  return new Intl.NumberFormat("en-GH", {
    style: "currency",
    currency: "GHS",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

export default async function FeeStructureDetailsPage({
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
      isActive: feeStructures.isActive,
      createdAt: feeStructures.createdAt,
      updatedAt: feeStructures.updatedAt,
      academicYearId: feeStructures.academicYearId,
      termId: feeStructures.termId,
      classLevelId: feeStructures.classLevelId,
      academicYearName: academicYears.name,
      termName: terms.name,
      classLevelName: classLevels.name,
    })
    .from(feeStructures)
    .leftJoin(
      academicYears,
      eq(academicYears.id, feeStructures.academicYearId),
    )
    .leftJoin(terms, eq(terms.id, feeStructures.termId))
    .leftJoin(classLevels, eq(classLevels.id, feeStructures.classLevelId))
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

  const items = await db
    .select({
      id: feeStructureItems.id,
      feeCategoryId: feeStructureItems.feeCategoryId,
      amount: feeStructureItems.amount,
      description: feeStructureItems.description,
      categoryName: feeCategories.name,
    })
    .from(feeStructureItems)
    .innerJoin(
      feeCategories,
      eq(feeCategories.id, feeStructureItems.feeCategoryId),
    )
    .where(eq(feeStructureItems.feeStructureId, structure.id))
    .orderBy(feeCategories.name);

  const total = items.reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0,
  );

  return (
    <main className="space-y-8 p-6 lg:p-8">
      <section>
        <Link
          href="/finance/fee-structures"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to fee structures
        </Link>

        <div className="mt-5 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <CircleDollarSign className="h-4 w-4" />
              Finance
              <span>/</span>
              Fee Structures
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-semibold tracking-tight">
                {structure.name}
              </h1>

              <span
                className={[
                  "inline-flex rounded-full px-2.5 py-1 text-xs font-medium",
                  structure.isActive
                    ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                    : "bg-muted text-muted-foreground",
                ].join(" ")}
              >
                {structure.isActive ? "Active" : "Inactive"}
              </span>
            </div>

            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              {structure.description ||
                "No description provided for this fee structure."}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href={`/finance/fee-structures/${structure.id}/edit`}
              className="inline-flex items-center gap-2 rounded-lg border bg-background px-4 py-2.5 text-sm font-medium shadow-sm transition hover:bg-muted"
            >
              <Edit3 className="h-4 w-4" />
              Edit
            </Link>

            <form
  action={async (formData) => {
    await toggleFeeStructureAction(formData);
  }}
>
              <input
                type="hidden"
                name="feeStructureId"
                value={structure.id}
              />
              <input
                type="hidden"
                name="isActive"
                value={String(!structure.isActive)}
              />

              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-lg border bg-background px-4 py-2.5 text-sm font-medium shadow-sm transition hover:bg-muted"
              >
                <Power className="h-4 w-4" />
                {structure.isActive ? "Deactivate" : "Activate"}
              </button>
            </form>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <InfoCard
          label="Academic year"
          value={structure.academicYearName || "—"}
        />

        <InfoCard
          label="Term"
          value={structure.termName || "—"}
        />

        <InfoCard
          label="Class level"
          value={structure.classLevelName || "—"}
        />
      </section>

      <section className="overflow-hidden rounded-xl border bg-card shadow-sm">
        <div className="flex flex-col gap-3 border-b px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold">Fee components</h2>
            <p className="text-sm text-muted-foreground">
              Categories and amounts included in this structure.
            </p>
          </div>

          <div className="text-right">
            <p className="text-xs text-muted-foreground">
              Total structure value
            </p>
            <p className="text-lg font-semibold">
              {formatMoney(total)}
            </p>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="flex min-h-56 items-center justify-center px-6 text-center">
            <div>
              <FileText className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="mt-3 font-medium">
                No fee components
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Edit this structure to add fee categories and amounts.
              </p>

              <Link
                href={`/finance/fee-structures/${structure.id}/edit`}
                className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
              >
                <Edit3 className="h-4 w-4" />
                Edit fee structure
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="hidden grid-cols-[1.4fr_1fr_1fr] gap-4 border-b bg-muted/30 px-5 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground sm:grid">
              <span>Category</span>
              <span>Description</span>
              <span className="text-right">Amount</span>
            </div>

            <div className="divide-y">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="grid gap-2 px-5 py-4 sm:grid-cols-[1.4fr_1fr_1fr] sm:items-center sm:gap-4"
                >
                  <div>
                    <p className="font-medium">
                      {item.categoryName}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground sm:hidden">
                      {item.description || "No description"}
                    </p>
                  </div>

                  <p className="hidden text-sm text-muted-foreground sm:block">
                    {item.description || "—"}
                  </p>

                  <p className="font-semibold sm:text-right">
                    {formatMoney(item.amount)}
                  </p>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between border-t bg-muted/20 px-5 py-4">
              <span className="font-medium">Total</span>
              <span className="text-lg font-semibold">
                {formatMoney(total)}
              </span>
            </div>
          </>
        )}
      </section>
    </main>
  );
}

function InfoCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 font-semibold">{value}</p>
    </div>
  );
}