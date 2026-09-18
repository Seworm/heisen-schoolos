import Link from "next/link";
import { and, asc, eq, inArray } from "drizzle-orm";
import { notFound } from "next/navigation";

import { db } from "@/db";
import {
  academicYears,
  classLevels,
  resultPublicationAssessments,
  resultPublicationStudents,
  resultPublicationSubjects,
  resultPublications,
  streams,
  terms,
} from "@/db/schema";
import { requireCurrentSchool } from "@/lib/current-school";

import PublishedStudentResult from "./PublishedStudentResult";

type PageParams = {
  id: string;
  studentId: string;
};

type PageProps = {
  params: Promise<PageParams>;
};

export type PublishedStudentAssessment = {
  id: string;
  assessmentId: string | null;
  assessmentName: string;
  assessmentTypeName: string;
  category:
    | "continuous_assessment"
    | "examination";
  score: number;
  maxScore: number;
  percentage: number;
  weightPercent: number;
  weightedContribution: number;
};

export type PublishedStudentSubject = {
  id: string;
  subjectId: string;
  subjectName: string;
  classScore: number;
  examinationScore: number;
  finalPercentage: number;
  grade: string | null;
  label: string | null;
  remark: string | null;
  position: number;
  assessments: PublishedStudentAssessment[];
};

export type PublishedStudentResultData = {
  publication: {
    id: string;
    academicYearName: string;
    termName: string;
    className: string;
    streamName: string;
    publishedAt: Date | null;
  };
  student: {
    snapshotId: string;
    studentId: string;
    studentNumber: string;
    firstName: string;
    middleName: string | null;
    lastName: string;
    overallPercentage: number;
    position: number;
  };
  subjects: PublishedStudentSubject[];
};

export default async function PublishedStudentResultPage({
  params,
}: PageProps) {
  const school = await requireCurrentSchool();
  const { id, studentId } = await params;

  /*
   * ============================================================
   * PUBLICATION + STUDENT SNAPSHOT
   * ============================================================
   *
   * The publication must:
   * - belong to the current school
   * - exist
   * - have status = published
   *
   * The student must:
   * - belong to this publication
   * - match the student UUID in the route
   *
   * All displayed student information comes from the
   * immutable result_publication_students snapshot.
   */

  const [studentRow] = await db
    .select({
      publicationId: resultPublications.id,

      academicYearName: academicYears.name,

      termName: terms.name,

      className: classLevels.name,

      streamName: streams.name,

      publishedAt: resultPublications.publishedAt,

      snapshotId: resultPublicationStudents.id,

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
    .innerJoin(
      resultPublications,
      eq(
        resultPublicationStudents.publicationId,
        resultPublications.id,
      ),
    )
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
        eq(
          resultPublicationStudents.studentId,
          studentId,
        ),
      ),
    )
    .limit(1);

  if (!studentRow) {
    notFound();
  }

  /*
   * ============================================================
   * SUBJECT SNAPSHOTS
   * ============================================================
   *
   * These are historical subject results.
   *
   * DO NOT query:
   * - assessments
   * - assessment_scores
   * - grading_schemes
   * - grading_scheme_items
   *
   * The published snapshot already contains the final values.
   */

  const subjectRows = await db
    .select({
      id: resultPublicationSubjects.id,

      subjectId:
        resultPublicationSubjects.subjectId,

      subjectName:
        resultPublicationSubjects.subjectName,

      classScore:
        resultPublicationSubjects.classScore,

      examinationScore:
        resultPublicationSubjects.examinationScore,

      finalPercentage:
        resultPublicationSubjects.finalPercentage,

      grade:
        resultPublicationSubjects.grade,

      label:
        resultPublicationSubjects.label,

      remark:
        resultPublicationSubjects.remark,

      position:
        resultPublicationSubjects.position,
    })
    .from(resultPublicationSubjects)
    .where(
      eq(
        resultPublicationSubjects.publicationStudentId,
        studentRow.snapshotId,
      ),
    )
    .orderBy(
      asc(
        resultPublicationSubjects.position,
      ),
      asc(
        resultPublicationSubjects.subjectName,
      ),
    );

  /*
   * ============================================================
   * ASSESSMENT SNAPSHOTS
   * ============================================================
   *
   * Fetch every assessment snapshot for this student's
   * published subjects in ONE database query.
   */

  const subjectIds = subjectRows.map(
    (subject) => subject.id,
  );

  const assessmentRows =
    subjectIds.length > 0
      ? await db
          .select({
            id:
              resultPublicationAssessments.id,

            publicationSubjectId:
              resultPublicationAssessments.publicationSubjectId,

            assessmentId:
              resultPublicationAssessments.assessmentId,

            assessmentName:
              resultPublicationAssessments.assessmentName,

            assessmentTypeName:
              resultPublicationAssessments.assessmentTypeName,

            category:
              resultPublicationAssessments.category,

            score:
              resultPublicationAssessments.score,

            maxScore:
              resultPublicationAssessments.maxScore,

            percentage:
              resultPublicationAssessments.percentage,

            weightPercent:
              resultPublicationAssessments.weightPercent,

            weightedContribution:
              resultPublicationAssessments.weightedContribution,
          })
          .from(
            resultPublicationAssessments,
          )
          .where(
            inArray(
              resultPublicationAssessments.publicationSubjectId,
              subjectIds,
            ),
          )
          .orderBy(
            asc(
              resultPublicationAssessments.category,
            ),
            asc(
              resultPublicationAssessments.assessmentName,
            ),
          )
      : [];

  /*
   * ============================================================
   * GROUP ASSESSMENTS BY SUBJECT
   * ============================================================
   */

  const assessmentsBySubject =
    new Map<
      string,
      PublishedStudentAssessment[]
    >();

  for (const row of assessmentRows) {
    const existing =
      assessmentsBySubject.get(
        row.publicationSubjectId,
      ) ?? [];

    existing.push({
      id: row.id,

      assessmentId:
        row.assessmentId,

      assessmentName:
        row.assessmentName,

      assessmentTypeName:
        row.assessmentTypeName,

      category:
        row.category as
          | "continuous_assessment"
          | "examination",

      score: Number(row.score),

      maxScore: Number(
        row.maxScore,
      ),

      percentage: Number(
        row.percentage,
      ),

      weightPercent: Number(
        row.weightPercent,
      ),

      weightedContribution:
        Number(
          row.weightedContribution,
        ),
    });

    assessmentsBySubject.set(
      row.publicationSubjectId,
      existing,
    );
  }

  /*
   * ============================================================
   * BUILD FINAL IMMUTABLE RESULT MODEL
   * ============================================================
   */

  const subjects: PublishedStudentSubject[] =
    subjectRows.map((subject) => ({
      id: subject.id,

      subjectId:
        subject.subjectId,

      subjectName:
        subject.subjectName,

      classScore: Number(
        subject.classScore,
      ),

      examinationScore: Number(
        subject.examinationScore,
      ),

      finalPercentage: Number(
        subject.finalPercentage,
      ),

      grade:
        subject.grade,

      label:
        subject.label,

      remark:
        subject.remark,

      position:
        subject.position,

      assessments:
        assessmentsBySubject.get(
          subject.id,
        ) ?? [],
    }));

  const result: PublishedStudentResultData =
    {
      publication: {
        id:
          studentRow.publicationId,

        academicYearName:
          studentRow.academicYearName,

        termName:
          studentRow.termName,

        className:
          studentRow.className,

        streamName:
          studentRow.streamName,

        publishedAt:
          studentRow.publishedAt,
      },

      student: {
        snapshotId:
          studentRow.snapshotId,

        studentId:
          studentRow.studentId,

        studentNumber:
          studentRow.studentNumber,

        firstName:
          studentRow.firstName,

        middleName:
          studentRow.middleName,

        lastName:
          studentRow.lastName,

        overallPercentage:
          Number(
            studentRow.overallPercentage,
          ),

        position:
          studentRow.position,
      },

      subjects,
    };

  return (
    <main className="mx-auto max-w-[1600px] space-y-8">
      {/* ========================================================
          HEADER
          ======================================================== */}

      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Link
            href={`/assessments/results/published/${id}`}
            className="text-sm font-medium text-slate-500 transition hover:text-slate-900"
          >
            ← Back to published results
          </Link>

          <div className="mt-4 flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">
              ✓
            </span>

            <span className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">
              Official student result
            </span>
          </div>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
            {formatStudentName(
              result.student,
            )}
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            {result.student.studentNumber}
            {" • "}
            {result.publication.className}
            {" • "}
            {result.publication.streamName}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Class results */}
          <Link
            href={`/assessments/results/published/${id}`}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
          >
            Class results
          </Link>

          {/* View Report Card */}
          <Link
            href={`/assessments/results/published/${id}/students/${studentId}/report-card`}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-slate-800"
          >
            <span aria-hidden="true">▣</span>
            View Report Card
          </Link>

          {/* Publication status */}
          <span className="inline-flex items-center gap-2 rounded-xl bg-emerald-100 px-4 py-2.5 text-sm font-bold text-emerald-700">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Published
          </span>
        </div>
      </div>

      {/* ========================================================
          IMMUTABLE RECORD NOTICE
          ======================================================== */}

      <section className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-sm font-bold text-white">
            ✓
          </div>

          <div>
            <h2 className="text-sm font-bold text-emerald-900">
              Official historical result
            </h2>

            <p className="mt-1 max-w-4xl text-sm leading-6 text-emerald-800">
              This result is displayed from the
              published historical snapshot. It is
              not recalculated from the current
              assessment records.
            </p>

            {result.publication.publishedAt ? (
              <p className="mt-2 text-xs font-semibold text-emerald-700">
                Published{" "}
                {formatPublishedDate(
                  result.publication.publishedAt,
                )}
              </p>
            ) : null}
          </div>
        </div>
      </section>

      <PublishedStudentResult
        result={result}
      />
    </main>
  );
}

function formatStudentName(student: {
  firstName: string;
  middleName: string | null;
  lastName: string;
}) {
  return [
    student.firstName,
    student.middleName,
    student.lastName,
  ]
    .filter(Boolean)
    .join(" ");
}

function formatPublishedDate(
  date: Date,
) {
  return new Intl.DateTimeFormat(
    "en-GB",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    },
  ).format(date);
}