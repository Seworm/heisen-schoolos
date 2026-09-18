import Link from "next/link";
import { and, asc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";

import { db } from "@/db";
import {
  academicYears,
  classLevels,
  resultPublicationStudents,
  resultPublicationSubjects,
  resultPublications,
  streams,
  terms,
} from "@/db/schema";
import { requireCurrentSchool } from "@/lib/current-school";

import PublishedResultTable from "./PublishedResultTable";

type PageParams = {
  id: string;
};

type PublishedResultPageProps = {
  params: Promise<PageParams>;
};

export type PublishedStudentResult = {
  id: string;
  studentId: string;
  studentNumber: string;
  firstName: string;
  middleName: string | null;
  lastName: string;
  overallPercentage: number;
  position: number;
};

export type PublishedResultPublication = {
  id: string;
  academicYearName: string;
  termName: string;
  className: string;
  streamName: string;
  status: "published";
  publishedAt: Date | null;
  students: PublishedStudentResult[];
};

export default async function PublishedResultPage({
  params,
}: PublishedResultPageProps) {
  const school = await requireCurrentSchool();
  const { id } = await params;

  /*
   * ============================================================
   * PUBLICATION
   * ============================================================
   *
   * This page intentionally reads the immutable publication
   * snapshot.
   *
   * It does NOT use:
   * - live assessments
   * - live assessment scores
   * - live grading calculations
   *
   * The published snapshot is the historical source of truth.
   */

  const [publicationRow] = await db
    .select({
      id: resultPublications.id,
      academicYearName: academicYears.name,
      termName: terms.name,
      className: classLevels.name,
      streamName: streams.name,
      status: resultPublications.status,
      publishedAt: resultPublications.publishedAt,
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
    .where(
      and(
        eq(
          resultPublications.id,
          id,
        ),
        eq(
          resultPublications.schoolId,
          school.id,
        ),
        eq(
          resultPublications.status,
          "published",
        ),
      ),
    )
    .limit(1);

  if (!publicationRow) {
    notFound();
  }

  /*
   * ============================================================
   * SNAPSHOT STUDENTS
   * ============================================================
   */

  const studentRows = await db
    .select({
      id: resultPublicationStudents.id,
      studentId: resultPublicationStudents.studentId,
      studentNumber: resultPublicationStudents.studentNumber,
      firstName: resultPublicationStudents.firstName,
      middleName: resultPublicationStudents.middleName,
      lastName: resultPublicationStudents.lastName,
      overallPercentage:
        resultPublicationStudents.overallPercentage,
      position: resultPublicationStudents.position,
    })
    .from(resultPublicationStudents)
    .where(
      eq(
        resultPublicationStudents.publicationId,
        publicationRow.id,
      ),
    )
    .orderBy(
      asc(resultPublicationStudents.position),
      asc(resultPublicationStudents.studentNumber),
    );

  /*
   * ============================================================
   * SNAPSHOT SUBJECTS
   * ============================================================
   *
   * Subjects are also read from the immutable publication
   * snapshot. We use them to determine the number of subjects
   * preserved in this publication.
   */

  const subjectRows = await db
    .select({
      id: resultPublicationSubjects.id,
      publicationStudentId:
        resultPublicationSubjects.publicationStudentId,
      subjectName:
        resultPublicationSubjects.subjectName,
      position:
        resultPublicationSubjects.position,
    })
    .from(resultPublicationSubjects)
    .innerJoin(
      resultPublicationStudents,
      eq(
        resultPublicationSubjects.publicationStudentId,
        resultPublicationStudents.id,
      ),
    )
    .where(
      eq(
        resultPublicationStudents.publicationId,
        publicationRow.id,
      ),
    )
    .orderBy(
      asc(resultPublicationStudents.position),
      asc(resultPublicationSubjects.position),
    );

  /*
   * ============================================================
   * NORMALIZE STUDENTS
   * ============================================================
   */

  const students: PublishedStudentResult[] =
    studentRows.map((student) => ({
      id: student.id,
      studentId: student.studentId,
      studentNumber: student.studentNumber,
      firstName: student.firstName,
      middleName: student.middleName,
      lastName: student.lastName,
      overallPercentage: Number(
        student.overallPercentage,
      ),
      position: student.position,
    }));

  /*
   * ============================================================
   * CLASS AVERAGE
   * ============================================================
   *
   * Display-only calculation from the published student
   * snapshots. This does not alter the published results.
   */

  const classAverage =
    students.length > 0
      ? roundToTwoDecimals(
          students.reduce(
            (total, student) =>
              total + student.overallPercentage,
            0,
          ) / students.length,
        )
      : 0;

  /*
   * ============================================================
   * SUBJECT COUNT
   * ============================================================
   */

  const subjectCount = new Set(
    subjectRows.map(
      (subject) => subject.subjectName,
    ),
  ).size;

  /*
   * ============================================================
   * PUBLICATION OBJECT
   * ============================================================
   */

  const publication: PublishedResultPublication = {
    id: publicationRow.id,
    academicYearName:
      publicationRow.academicYearName,
    termName: publicationRow.termName,
    className: publicationRow.className,
    streamName: publicationRow.streamName,
    status: "published",
    publishedAt:
      publicationRow.publishedAt,
    students,
  };

  return (
    <main className="mx-auto max-w-[1600px] space-y-8">
      {/* ========================================================
          HEADER
          ======================================================== */}

      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Link
            href="/assessments/results/published"
            className="text-sm font-medium text-slate-500 transition hover:text-slate-900"
          >
            ← Back to published results
          </Link>

          <div className="mt-4 flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">
              ✓
            </span>

            <span className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">
              Official published result
            </span>
          </div>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
            {publication.className}
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            {publication.streamName} •{" "}
            {publication.termName} •{" "}
            {publication.academicYearName}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/assessments/results"
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
          >
            Results workspace
          </Link>

          <Link
            href={`/assessments/results/published/${publication.id}/report-cards`}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-slate-800"
          >
            <span aria-hidden="true">▣</span>
            Report Cards
          </Link>

          <span className="inline-flex items-center gap-2 rounded-xl bg-emerald-100 px-4 py-2.5 text-sm font-bold text-emerald-700">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Published
          </span>
        </div>
      </div>

      {/* ========================================================
          HISTORICAL RECORD NOTICE
          ======================================================== */}

      <section className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-sm font-bold text-white">
            ✓
          </div>

          <div>
            <h2 className="text-sm font-bold text-emerald-900">
              Historical result snapshot
            </h2>

            <p className="mt-1 max-w-4xl text-sm leading-6 text-emerald-800">
              This page displays the officially published
              result snapshot. The figures shown here are
              preserved from the time of publication and are
              not recalculated from current assessment data.
            </p>

            {publication.publishedAt ? (
              <p className="mt-2 text-xs font-semibold text-emerald-700">
                Published{" "}
                {formatPublishedDate(
                  publication.publishedAt,
                )}
              </p>
            ) : null}
          </div>
        </div>
      </section>

      {/* ========================================================
          SUMMARY
          ======================================================== */}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          label="Students"
          value={students.length}
          description="Students in this publication"
        />

        <SummaryCard
          label="Subjects"
          value={subjectCount}
          description="Subjects preserved in snapshot"
        />

        <SummaryCard
          label="Class average"
          value={`${classAverage.toFixed(2)}%`}
          description="Average of published overall results"
        />

        <SummaryCard
          label="Status"
          value="Published"
          description={
            publication.publishedAt
              ? formatPublishedDate(
                  publication.publishedAt,
                )
              : "Official record"
          }
        />
      </div>

      {/* ========================================================
          STUDENT RESULTS
          ======================================================== */}

      <PublishedResultTable
        publication={publication}
      />
    </main>
  );
}

/* ================================================================
   SUMMARY CARD
   ================================================================ */

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

/* ================================================================
   DATE FORMATTER
   ================================================================ */

function formatPublishedDate(date: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

/* ================================================================
   NUMBER FORMATTER
   ================================================================ */

function roundToTwoDecimals(value: number) {
  return Math.round(value * 100) / 100;
}