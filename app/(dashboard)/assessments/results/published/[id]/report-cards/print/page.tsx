import Link from "next/link";
import { notFound } from "next/navigation";

import ReportCard, {
  type ReportCardData,
  type ReportCardSubject,
} from "../../students/[studentID]/report-card/ReportCard";

import { getApprovedReportCards } from "./data";
import {
  getReportCardAttendanceForStudents,
} from "@/lib/report-card-attendance";

function toNumber(value: unknown): number {
  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : 0;
}

function buildStudentName(
  firstName: string,
  middleName: string | null,
  lastName: string,
) {
  return [
    firstName,
    middleName,
    lastName,
  ]
    .filter(Boolean)
    .join(" ");
}

function roundToTwoDecimals(
  value: number,
) {
  return Math.round(value * 100) / 100;
}

export default async function BatchReportCardPrintPage({
  params,
}: {
  params: Promise<{
    id: string;
  }>;
}) {
  const { id: publicationId } =
    await params;

  let data;

  try {
    data =
      await getApprovedReportCards(
        publicationId,
      );
  } catch {
    notFound();
  }

  if (data.rows.length === 0) {
    return (
      <main className="min-h-screen bg-slate-100 px-6 py-16">
        <div className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-xl font-black text-slate-950">
            No Approved Report Cards
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            There are currently no approved
            report cards available for
            printing for this publication.
          </p>

          <Link
            href={`/assessments/results/published/${publicationId}/report-cards`}
            className="mt-6 inline-flex rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-bold text-white"
          >
            Back to Report Cards
          </Link>
        </div>
      </main>
    );
  }

  /*
   * ============================================================
   * SUBJECTS BY STUDENT
   * ============================================================
   */

  const subjectsByStudent =
    new Map<
      string,
      typeof data.subjects
    >();

  for (const subject of data.subjects) {
    const existing =
      subjectsByStudent.get(
        subject.publicationStudentId,
      ) ?? [];

    existing.push(subject);

    subjectsByStudent.set(
      subject.publicationStudentId,
      existing,
    );
  }

  /*
   * ============================================================
   * ASSESSMENTS BY SUBJECT
   * ============================================================
   *
   * Kept here for future detailed print-card
   * expansion and to preserve the complete
   * publication snapshot loaded by data.ts.
   */

  const assessmentsBySubject =
    new Map<
      string,
      typeof data.assessments
    >();

  for (const assessment of data.assessments) {
    const existing =
      assessmentsBySubject.get(
        assessment.publicationSubjectId,
      ) ?? [];

    existing.push(assessment);

    assessmentsBySubject.set(
      assessment.publicationSubjectId,
      existing,
    );
  }

  /*
   * ============================================================
   * ATTENDANCE
   * ============================================================
   *
   * One batch calculation for all approved
   * students. This uses the same attendance
   * rules as the individual report-card page.
   */

  const studentIds =
    data.rows.map(
      (row) => row.studentId,
    );

  const attendanceByStudent =
    await getReportCardAttendanceForStudents({
      schoolId:
        data.school.id,

      academicYearId:
        data.publication.academicYearId,

      termId:
        data.publication.termId,

      streamId:
        data.publication.streamId,

      studentIds,
    });

  return (
    <>
      <style>{`
        @page {
          size: A4 portrait;
          margin: 10mm;
        }

        html,
        body {
          margin: 0;
          padding: 0;
          background: #e5e7eb;
        }

        * {
          box-sizing: border-box;
        }

        .batch-print-toolbar {
          display: flex;
        }

        .batch-report-card {
          width: 100%;
          max-width: 794px;
          margin: 32px auto;
          background: white;
        }

        @media print {
          html,
          body {
            background: white !important;
          }

          .batch-print-toolbar {
            display: none !important;
          }

          .batch-report-card {
            width: 100% !important;
            max-width: none !important;
            margin: 0 !important;
            page-break-after: always;
            break-after: page;
          }

          .batch-report-card:last-child {
            page-break-after: auto;
            break-after: auto;
          }
        }
      `}</style>

      {/* ==========================================================
          TOOLBAR
      ========================================================== */}

      <div className="batch-print-toolbar sticky top-0 z-50 items-center justify-between border-b border-slate-200 bg-white px-6 py-4 shadow-sm">
        <div>
          <p className="text-sm font-black text-slate-950">
            Approved Report Cards
          </p>

          <p className="text-xs text-slate-500">
            {data.rows.length} approved
            report card
            {data.rows.length === 1
              ? ""
              : "s"} ready for printing
          </p>

          <p className="mt-1 text-xs text-slate-400">
            {data.publication.academicYearName}
            {" • "}
            {data.publication.termName}
            {" • "}
            {data.publication.className}
            {" "}
            {data.publication.streamName}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/assessments/results/published/${publicationId}/report-cards`}
            className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-bold text-slate-700"
          >
            Back
          </Link>

          <button
            type="button"
            onClick={() =>
              window.print()
            }
            className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-bold text-white"
          >
            Print All Approved
          </button>
        </div>
      </div>

      {/* ==========================================================
          REPORT CARDS
      ========================================================== */}

      <main className="px-4 py-8 print:p-0">
        {data.rows.map((row) => {
          const studentSubjects =
            subjectsByStudent.get(
              row.studentSnapshotId,
            ) ?? [];

          const reportCardSubjects: ReportCardSubject[] =
            studentSubjects.map(
              (subject) => ({
                id: subject.id,

                subjectName:
                  subject.subjectName,

                classScore:
                  toNumber(
                    subject.classScore,
                  ),

                examinationScore:
                  toNumber(
                    subject.examinationScore,
                  ),

                finalPercentage:
                  toNumber(
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
              }),
            );

          const attendance =
            attendanceByStudent.get(
              row.studentId,
            ) ?? {
              schoolDays: 0,
              present: 0,
              late: 0,
              absent: 0,
              excused: 0,
              attendancePercentage: 0,
            };

          const reportCardData: ReportCardData =
            {
              school: {
                id:
                  data.school.id,

                name:
                  data.school.name,
              },

              publication: {
                id:
                  data.publication.id,

                academicYearName:
                  data.publication
                    .academicYearName,

                termName:
                  data.publication
                    .termName,

                className:
                  data.publication
                    .className,

                classCategory:
                  data.publication
                    .classCategory,

                streamName:
                  data.publication
                    .streamName,

                publishedAt:
                  data.publication
                    .publishedAt,
              },

              student: {
                id:
                  row.studentId,

                snapshotId:
                  row.studentSnapshotId,

                name:
                  buildStudentName(
                    row.firstName,
                    row.middleName,
                    row.lastName,
                  ),

                studentNumber:
                  row.studentNumber,

                overallPercentage:
                  roundToTwoDecimals(
                    toNumber(
                      row.overallPercentage,
                    ),
                  ),

                position:
                  row.overallPosition,
              },

              attendance,

              subjects:
                reportCardSubjects,

              remarks: {
                classTeacher:
                  row.classTeacherRemark ??
                  "",

                headteacher:
                  row.headteacherRemark ??
                  "",
              },

              promotionStatus:
                row.promotionStatus ??
                "pending",

              signatures: {
                classTeacherSignedAt:
                  row.classTeacherSignedAt,

                headteacherSignedAt:
                  row.headteacherSignedAt,
              },
            };

          return (
            <section
              key={
                row.reportCardId
              }
              className="batch-report-card"
            >
              <ReportCard
                data={reportCardData}
              />
            </section>
          );
        })}
      </main>
    </>
  );
}