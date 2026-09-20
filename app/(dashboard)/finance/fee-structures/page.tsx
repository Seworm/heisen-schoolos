import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  CircleDollarSign,
  FilePlus2,
  Layers3,
  Plus,
  Settings2,
  XCircle,
} from "lucide-react";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import {
  academicYears,
  classLevels,
  feeStructures,
  terms,
} from "@/db/schema";
import { getCurrentSchool } from "@/lib/current-school";

function formatDate(value: string | Date | null) {
  if (!value) return "—";

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-GH", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export default async function FeeStructuresPage() {
  const school = await getCurrentSchool();

  const structures = await db
    .select({
      id: feeStructures.id,
      name: feeStructures.name,
      description: feeStructures.description,
      isActive: feeStructures.isActive,
      createdAt: feeStructures.createdAt,
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
    .where(eq(feeStructures.schoolId, school.id))
    .orderBy(feeStructures.createdAt);

  const activeCount = structures.filter(
    (structure) => structure.isActive,
  ).length;

  const inactiveCount = structures.length - activeCount;

  return (
    <main className="space-y-8 p-6 lg:p-8">
      <section className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <CircleDollarSign className="h-4 w-4" />
            Finance
            <span>/</span>
            Fee Structures
          </div>

          <h1 className="text-3xl font-semibold tracking-tight">
            Fee Structures
          </h1>

          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Define the fees students should be charged by academic year,
            term and class level.
          </p>
        </div>

        <Link
          href="/finance/fee-structures/new"
          className="inline-flex w-fit items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          New fee structure
        </Link>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <SummaryCard
          label="Total structures"
          value={structures.length.toLocaleString("en-GH")}
          description="Configured fee structures"
          icon={Layers3}
        />

        <SummaryCard
          label="Active"
          value={activeCount.toLocaleString("en-GH")}
          description="Available for assignment"
          icon={CheckCircle2}
        />

        <SummaryCard
          label="Inactive"
          value={inactiveCount.toLocaleString("en-GH")}
          description="Currently disabled"
          icon={XCircle}
        />
      </section>

      <section className="overflow-hidden rounded-xl border bg-card shadow-sm">
        <div className="flex flex-col gap-3 border-b px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold">Configured fee structures</h2>
            <p className="text-sm text-muted-foreground">
              Each structure can contain multiple fee categories.
            </p>
          </div>

          <Link
            href="/finance/fee-structures/new"
            className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
          >
            <FilePlus2 className="h-4 w-4" />
            Create structure
          </Link>
        </div>

        {structures.length === 0 ? (
          <div className="flex min-h-72 items-center justify-center px-6 text-center">
            <div className="max-w-md">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
                <Settings2 className="h-6 w-6 text-muted-foreground" />
              </div>

              <h3 className="mt-4 font-semibold">
                No fee structures yet
              </h3>

              <p className="mt-2 text-sm text-muted-foreground">
                Create your first fee structure to define what students
                should be charged for a particular class, term and
                academic year.
              </p>

              <Link
                href="/finance/fee-structures/new"
                className="mt-5 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90"
              >
                <Plus className="h-4 w-4" />
                Create fee structure
              </Link>
            </div>
          </div>
        ) : (
          <div className="divide-y">
            {structures.map((structure) => (
              <Link
                key={structure.id}
                href={`/finance/fee-structures/${structure.id}`}
                className="group flex flex-col gap-4 px-5 py-5 transition hover:bg-muted/40 lg:flex-row lg:items-center lg:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-medium">{structure.name}</h3>

                    <span
                      className={[
                        "inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium",
                        structure.isActive
                          ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                          : "bg-muted text-muted-foreground",
                      ].join(" ")}
                    >
                      {structure.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>

                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                    {structure.description || "No description provided."}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span>
                      Academic year:{" "}
                      <strong className="font-medium text-foreground">
                        {structure.academicYearName || "—"}
                      </strong>
                    </span>

                    <span>
                      Term:{" "}
                      <strong className="font-medium text-foreground">
                        {structure.termName || "—"}
                      </strong>
                    </span>

                    <span>
                      Class:{" "}
                      <strong className="font-medium text-foreground">
                        {structure.classLevelName || "—"}
                      </strong>
                    </span>

                    <span>
                      Created: {formatDate(structure.createdAt)}
                    </span>
                  </div>
                </div>

                <ArrowRight className="hidden h-4 w-4 shrink-0 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-foreground lg:block" />
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function SummaryCard({
  label,
  value,
  description,
  icon: Icon,
}: {
  label: string;
  value: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-muted-foreground">{label}</span>

        <div className="rounded-lg bg-muted p-2">
          <Icon className="h-4 w-4" />
        </div>
      </div>

      <p className="mt-4 text-2xl font-semibold tracking-tight">
        {value}
      </p>

      <p className="mt-1 text-xs text-muted-foreground">
        {description}
      </p>
    </div>
  );
}

