import Link from "next/link";
import { and, asc, eq } from "drizzle-orm";

import { db } from "@/db";
import {
  academicYears,
  classLevels,
  resultPublications,
  streams,
  terms,
} from "@/db/schema";
import { requireCurrentSchool } from "@/lib/current-school";
import { getResultDataset } from "@/lib/result-data";

import ResultsWorkspace from "./ResultsWorkspace";

type SearchParams = {
  academicYearId?: string;
  termId?: string;
  streamId?: string;
};

export type ResultPublicationStatus =
  | "draft"
  | "ready"
  | "published"
  | "archived";

export default async function ResultsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const school = await requireCurrentSchool();
  const params = await searchParams;

  /*
   * ============================================================
   * ACADEMIC YEARS
   * ============================================================
   */

  const academicYearsRows = await db
    .select({
      id: academicYears.id,
      name: academicYears.name,
      startDate: academicYears.startDate,
      endDate: academicYears.endDate,
    })
    .from(academicYears)
    .where(eq(academicYears.schoolId, school.id))
    .orderBy(asc(academicYears.startDate));

  const selectedAcademicYearId =
    params.academicYearId ??
    academicYearsRows[
      academicYearsRows.length - 1
    ]?.id ??
    null;

  /*
   * ============================================================
   * TERMS
   * ============================================================
   */

  let termRows: Array<{
    id: string;
    name: string;
    termNumber: number;
    startDate: string;
    endDate: string;
  }> = [];

  if (selectedAcademicYearId) {
    termRows = await db
      .select({
        id: terms.id,
        name: terms.name,
        termNumber: terms.termNumber,
        startDate: terms.startDate,
        endDate: terms.endDate,
      })
      .from(terms)
      .where(
        eq(
          terms.academicYearId,
          selectedAcademicYearId,
        ),
      )
      .orderBy(asc(terms.termNumber));
  }

  const selectedTermId =
    params.termId ??
    termRows[0]?.id ??
    null;

  /*
   * ============================================================
   * STREAMS
   * ============================================================
   */

  const streamRows = await db
    .select({
      id: streams.id,
      name: streams.name,
      classLevelId: streams.classLevelId,
      className: classLevels.name,
      classCategory: classLevels.category,
    })
    .from(streams)
    .innerJoin(
      classLevels,
      eq(
        streams.classLevelId,
        classLevels.id,
      ),
    )
    .where(
      eq(
        classLevels.schoolId,
        school.id,
      ),
    )
    .orderBy(
      asc(classLevels.name),
      asc(streams.name),
    );

  const selectedStreamId =
    params.streamId ??
    streamRows[0]?.id ??
    null;

  /*
   * ============================================================
   * RESULT PUBLICATION STATUS
   * ============================================================
   *
   * The database is the source of truth.
   *
   * We deliberately query publication status separately from
   * the live result dataset because a publication can exist
   * independently of the current live calculation state.
   */

  let publication: {
    id: string;
    status: ResultPublicationStatus;
    publishedAt: Date | null;
    gradingSchemeId: string | null;
  } | null = null;

  if (
    selectedAcademicYearId &&
    selectedTermId &&
    selectedStreamId
  ) {
    const [publicationRow] = await db
      .select({
        id: resultPublications.id,
        status: resultPublications.status,
        publishedAt:
          resultPublications.publishedAt,
        gradingSchemeId:
          resultPublications.gradingSchemeId,
      })
      .from(resultPublications)
      .where(
        and(
          eq(
            resultPublications.schoolId,
            school.id,
          ),
          eq(
            resultPublications.academicYearId,
            selectedAcademicYearId,
          ),
          eq(
            resultPublications.termId,
            selectedTermId,
          ),
          eq(
            resultPublications.streamId,
            selectedStreamId,
          ),
        ),
      )
      .limit(1);

    publication = publicationRow
      ? {
          id: publicationRow.id,
          status:
            publicationRow.status as ResultPublicationStatus,
          publishedAt:
            publicationRow.publishedAt,
          gradingSchemeId:
            publicationRow.gradingSchemeId,
        }
      : null;
  }

  /*
   * ============================================================
   * LIVE RESULT DATASET
   * ============================================================
   */

  let dataset = null;

  if (
    selectedAcademicYearId &&
    selectedTermId &&
    selectedStreamId
  ) {
    try {
      dataset = await getResultDataset({
        academicYearId:
          selectedAcademicYearId,
        termId: selectedTermId,
        streamId: selectedStreamId,
      });
    } catch {
      dataset = null;
    }
  }

  return (
    <main className="mx-auto max-w-[1600px] space-y-8">
      {/* ========================================================
          PAGE HEADER
          ======================================================== */}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Link
            href="/assessments"
            className="text-sm font-medium text-slate-500 transition hover:text-slate-900"
          >
            ← Back to assessments
          </Link>

          <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950">
            Results
          </h1>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
            Review student performance, class scores,
            examinations, final grades and overall class
            performance.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/assessments/results/published"
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
          >
            Published results
          </Link>

          <Link
            href="/assessments/grading"
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
          >
            Grading schemes
          </Link>

          <Link
            href="/assessments"
            className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
          >
            Assessments
          </Link>
        </div>
      </div>

      {/* ========================================================
          RESULT SCOPE FILTER
          ======================================================== */}

      <form
        method="GET"
        className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
      >
        <div className="grid gap-4 md:grid-cols-3">
          {/* Academic year */}

          <div>
            <label
              htmlFor="academicYearId"
              className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500"
            >
              Academic year
            </label>

            <select
              id="academicYearId"
              name="academicYearId"
              defaultValue={
                selectedAcademicYearId ?? ""
              }
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
            >
              {academicYearsRows.length === 0 ? (
                <option value="">
                  No academic years
                </option>
              ) : (
                academicYearsRows.map((year) => (
                  <option
                    key={year.id}
                    value={year.id}
                  >
                    {year.name}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Term */}

          <div>
            <label
              htmlFor="termId"
              className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500"
            >
              Term
            </label>

            <select
              id="termId"
              name="termId"
              defaultValue={
                selectedTermId ?? ""
              }
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
            >
              {termRows.length === 0 ? (
                <option value="">
                  No terms
                </option>
              ) : (
                termRows.map((term) => (
                  <option
                    key={term.id}
                    value={term.id}
                  >
                    {term.name}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Class / stream */}

          <div>
            <label
              htmlFor="streamId"
              className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500"
            >
              Class / stream
            </label>

            <select
              id="streamId"
              name="streamId"
              defaultValue={
                selectedStreamId ?? ""
              }
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
            >
              {streamRows.length === 0 ? (
                <option value="">
                  No streams
                </option>
              ) : (
                streamRows.map((stream) => (
                  <option
                    key={stream.id}
                    value={stream.id}
                  >
                    {stream.className} •{" "}
                    {stream.name}
                  </option>
                ))
              )}
            </select>
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            type="submit"
            className="rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
          >
            Load results
          </button>
        </div>
      </form>

      {/* ========================================================
          RESULT WORKSPACE
          ======================================================== */}

      {dataset ? (
        <ResultsWorkspace
          dataset={dataset}
          publication={publication}
        />
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-16 text-center">
          <h2 className="text-lg font-semibold text-slate-900">
            Results workspace unavailable
          </h2>

          <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">
            Select a valid academic year, term and class
            stream. Results can only be generated when
            those three academic dimensions are valid.
          </p>
        </div>
      )}
    </main>
  );
}

