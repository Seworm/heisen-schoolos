import Link from "next/link";
import { and, asc, desc, eq, sql } from "drizzle-orm";

import { db } from "@/db";
import {
  academicYears,
  classLevels,
  resultPublicationStudents,
  resultPublications,
  streams,
  terms,
} from "@/db/schema";
import { requireCurrentSchool } from "@/lib/current-school";

import PublishedResultsTable from "./PublishedResultsTable";

export type PublishedResultPublication = {
  id: string;
  academicYearId: string;
  academicYearName: string;
  termId: string;
  termName: string;
  streamId: string;
  streamName: string;
  classLevelId: string;
  className: string;
  studentCount: number;
  publishedAt: Date | null;
  status: "draft" | "ready" | "published" | "archived";
};

export default async function PublishedResultsPage() {
  const school = await requireCurrentSchool();

  const rows = await db
    .select({
      id: resultPublications.id,
      academicYearId: resultPublications.academicYearId,
      academicYearName: academicYears.name,
      termId: resultPublications.termId,
      termName: terms.name,
      streamId: resultPublications.streamId,
      streamName: streams.name,
      classLevelId: classLevels.id,
      className: classLevels.name,
      status: resultPublications.status,
      publishedAt: resultPublications.publishedAt,
      studentCount: sql<number>`count(${resultPublicationStudents.id})`,
    })
    .from(resultPublications)
    .innerJoin(
      academicYears,
      eq(
        resultPublications.academicYearId,
        academicYears.id,
      ),
    )
    .innerJoin(
      terms,
      eq(
        resultPublications.termId,
        terms.id,
      ),
    )
    .innerJoin(
      streams,
      eq(
        resultPublications.streamId,
        streams.id,
      ),
    )
    .innerJoin(
      classLevels,
      eq(
        streams.classLevelId,
        classLevels.id,
      ),
    )
    .leftJoin(
      resultPublicationStudents,
      eq(
        resultPublicationStudents.publicationId,
        resultPublications.id,
      ),
    )
    .where(
      and(
        eq(resultPublications.schoolId, school.id),
        eq(
          resultPublications.status,
          "published",
        ),
      ),
    )
    .groupBy(
      resultPublications.id,
      academicYears.id,
      terms.id,
      streams.id,
      classLevels.id,
    )
    .orderBy(
      desc(resultPublications.publishedAt),
      asc(academicYears.startDate),
      asc(terms.termNumber),
      asc(classLevels.name),
      asc(streams.name),
    );

  const publications: PublishedResultPublication[] =
    rows.map((row) => ({
      id: row.id,
      academicYearId: row.academicYearId,
      academicYearName: row.academicYearName,
      termId: row.termId,
      termName: row.termName,
      streamId: row.streamId,
      streamName: row.streamName,
      classLevelId: row.classLevelId,
      className: row.className,
      studentCount: Number(row.studentCount),
      publishedAt: row.publishedAt,
      status: row.status as PublishedResultPublication["status"],
    }));

  return (
    <main className="mx-auto max-w-[1600px] space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Link
            href="/assessments/results"
            className="text-sm font-medium text-slate-500 transition hover:text-slate-900"
          >
            ← Back to results
          </Link>

          <div className="mt-4">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />

              <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                Official records
              </p>
            </div>

            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
              Published Results
            </h1>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
              Access official result publications that have
              been finalized and stored as historical
              snapshots.
            </p>
          </div>
        </div>

        <Link
          href="/assessments/results"
          className="inline-flex w-fit items-center rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
        >
          Results workspace
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <SummaryCard
          label="Published sets"
          value={publications.length}
          description="Official result publications"
        />

        <SummaryCard
          label="Students recorded"
          value={publications.reduce(
            (total, publication) =>
              total + publication.studentCount,
            0,
          )}
          description="Across published result sets"
        />

        <SummaryCard
          label="Latest publication"
          value={
            publications[0]?.publishedAt
              ? formatPublishedDate(
                  publications[0].publishedAt,
                )
              : "None"
          }
          description="Most recently published"
        />
      </div>

      <PublishedResultsTable
        publications={publications}
      />
    </main>
  );
}

function SummaryCard({
  label,
  value,
  description,
}: {
  label: string;
  value: string | number;
  description: string;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
        {label}
      </p>

      <p className="mt-3 text-2xl font-bold tracking-tight text-slate-950">
        {value}
      </p>

      <p className="mt-1 text-sm text-slate-500">
        {description}
      </p>
    </section>
  );
}

function formatPublishedDate(date: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}