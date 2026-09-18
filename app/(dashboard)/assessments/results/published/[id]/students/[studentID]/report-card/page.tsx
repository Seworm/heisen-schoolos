import Link from "next/link";
import { and, asc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";

import { db } from "@/db";
import {
  academicYears,
  classLevels,
  reportCards,
  resultPublicationStudents,
  resultPublicationSubjects,
  resultPublications,
  streams,
  terms,
} from "@/db/schema";
import { requireCurrentSchool } from "@/lib/current-school";
import { getReportCardAttendance } from "@/lib/report-card-attendance";

import ReportCard, {
  type ReportCardData,
} from "./ReportCard";
import ReportCardEditor from "./ReportCardEditor";

type PageProps = {
  params: Promise<{
    id: string;
    studentID: string;
  }>;
};

export default async function ReportCardPage({
  params,
}: PageProps) {
  const {
    id: publicationId,
    studentID,
  } = await params;

  const school =
    await requireCurrentSchool();

  /*
   * ============================================================
   * PUBLISHED RESULT PUBLICATION
   * ============================================================
   *
   * Academic information comes from the immutable
   * published result publication.
   */

  const [publication] = await db
    .select({
      id: resultPublications.id,
      schoolId:
        resultPublications.schoolId,
      academicYearId:
        resultPublications.academicYearId,
      termId:
        resultPublications.termId,
      streamId:
        resultPublications.streamId,
      status:
        resultPublications.status,
      publishedAt:
        resultPublications.publishedAt,

      academicYearName:
        academicYears.name,
      termName:
        terms.name,
      streamName:
        streams.name,
      className:
        classLevels.name,
      classCategory:
        classLevels.category,
    })
    .from(resultPublications)
    .innerJoin(
      academicYears,
      eq(
        academicYears.id,
        resultPublications.academicYearId,
      ),
    )
    .innerJoin(
      terms,
      eq(
        terms.id,
        resultPublications.termId,
      ),
    )
    .innerJoin(
      streams,
      eq(
        streams.id,
        resultPublications.streamId,
      ),
    )
    .innerJoin(
      classLevels,
      eq(
        classLevels.id,
        streams.classLevelId,
      ),
    )
    .where(
      and(
        eq(
          resultPublications.id,
          publicationId,
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

  if (!publication) {
    notFound();
  }

  /*
   * ============================================================
   * PUBLISHED STUDENT SNAPSHOT
   * ============================================================
   */

  const [student] = await db
    .select({
      id:
        resultPublicationStudents.id,
      studentId:
        resultPublicationStudents.studentId,
      studentNumber:
        resultPublicationStudents.studentNumber,
      firstName:
        resultPublicationStudents.firstName,
      middleName:
        resultPublicationStudents.middleName,
      lastName:
        resultPublicationStudents.lastName,
      overallPercentage:
        resultPublicationStudents.overallPercentage,
      position:
        resultPublicationStudents.position,
    })
    .from(resultPublicationStudents)
    .where(
      and(
        eq(
          resultPublicationStudents.id,
          studentID,
        ),
        eq(
          resultPublicationStudents.publicationId,
          publication.id,
        ),
      ),
    )
    .limit(1);

  if (!student) {
    notFound();
  }

  /*
   * ============================================================
   * REPORT CARD WORKFLOW RECORD
   * ============================================================
   */

  const [reportCard] = await db
    .select({
      id: reportCards.id,
      status: reportCards.status,

      classTeacherRemark:
        reportCards.classTeacherRemark,

      headteacherRemark:
        reportCards.headteacherRemark,

      promotionStatus:
        reportCards.promotionStatus,

      classTeacherSignedAt:
        reportCards.classTeacherSignedAt,

      headteacherSignedAt:
        reportCards.headteacherSignedAt,
    })
    .from(reportCards)
    .where(
      and(
        eq(
          reportCards.publicationId,
          publication.id,
        ),
        eq(
          reportCards.publicationStudentId,
          student.id,
        ),
        eq(
          reportCards.schoolId,
          school.id,
        ),
      ),
    )
    .limit(1);

  if (!reportCard) {
    return (
      <div className="min-h-screen bg-slate-100">
        <div className="mx-auto max-w-[1100px] px-4 py-10">
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-lg">
                !
              </div>

              <div>
                <h1 className="font-bold text-amber-950">
                  Report card has not been generated
                </h1>

                <p className="mt-1 text-sm leading-6 text-amber-800">
                  This student does not yet have a
                  report card workflow record. Return
                  to the Report Cards workspace and
                  generate the report cards first.
                </p>

                <Link
                  href={`/assessments/results/published/${publication.id}/report-cards`}
                  className="mt-4 inline-flex rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-slate-800"
                >
                  Go to Report Cards
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /*
   * ============================================================
   * PUBLISHED SUBJECT SNAPSHOTS
   * ============================================================
   */

  const subjectRows = await db
    .select({
      id:
        resultPublicationSubjects.id,

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
        student.id,
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
   * ATTENDANCE
   * ============================================================
   *
   * This is now delegated to the shared attendance utility.
   *
   * Individual and batch report cards therefore use exactly
   * the same attendance rules.
   */

  const attendance =
    await getReportCardAttendance({
      schoolId: school.id,
      academicYearId:
        publication.academicYearId,
      termId:
        publication.termId,
      streamId:
        publication.streamId,
      studentId:
        student.studentId,
    });

  /*
   * ============================================================
   * REPORT CARD DATA
   * ============================================================
   */

  const studentName = [
    student.firstName,
    student.middleName,
    student.lastName,
  ]
    .filter(Boolean)
    .join(" ");

  const subjects: ReportCardData["subjects"] =
    subjectRows.map((subject) => ({
      id: subject.id,

      subjectName:
        subject.subjectName,

      classScore:
        Number(
          subject.classScore,
        ),

      examinationScore:
        Number(
          subject.examinationScore,
        ),

      finalPercentage:
        Number(
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
    }));

  const reportData: ReportCardData = {
    school: {
      id: school.id,
      name: school.name,
    },

    publication: {
      id: publication.id,

      academicYearName:
        publication.academicYearName,

      termName:
        publication.termName,

      className:
        publication.className,

      classCategory:
        publication.classCategory,

      streamName:
        publication.streamName,

      publishedAt:
        publication.publishedAt,
    },

    student: {
      id:
        student.studentId,

      snapshotId:
        student.id,

      name:
        studentName,

      studentNumber:
        student.studentNumber,

      overallPercentage:
        Number(
          student.overallPercentage,
        ),

      position:
        student.position,
    },

    attendance,

    subjects,

    remarks: {
      classTeacher:
        reportCard.classTeacherRemark ??
        "",

      headteacher:
        reportCard.headteacherRemark ??
        "",
    },

    promotionStatus:
      reportCard.promotionStatus ??
      "pending",

    signatures: {
      classTeacherSignedAt:
        reportCard.classTeacherSignedAt,

      headteacherSignedAt:
        reportCard.headteacherSignedAt,
    },
  };

  /*
   * ============================================================
   * PAGE
   * ============================================================
   */

  return (
    <div className="min-h-screen bg-slate-100 print:bg-white">
      <div className="mx-auto max-w-[1100px] px-4 py-6 print:max-w-none print:px-0 print:py-0">
        {/* ACTION BAR */}

        <div className="mb-5 flex flex-col gap-3 print:hidden sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href={`/assessments/results/published/${publication.id}/students/${student.id}`}
              className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              ← Back to Result
            </Link>

            <Link
              href={`/assessments/results/published/${publication.id}/report-cards`}
              className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Report Cards
            </Link>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <ReportCardStatusBadge
              status={reportCard.status}
            />

            <button
              type="button"
              onClick={() =>
                window.print()
              }
              className="inline-flex items-center rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Print Report Card
            </button>
          </div>
        </div>

        {/* REPORT CARD */}

        <ReportCard data={reportData} />

        {/* WORKFLOW EDITOR */}

        <div className="mt-8 print:hidden">
          <ReportCardEditor
            reportCardId={
              reportCard.id
            }
            publicationId={
              publication.id
            }
            studentSnapshotId={
              student.id
            }
            initialClassTeacherRemark={
              reportCard.classTeacherRemark ??
              ""
            }
            initialHeadteacherRemark={
              reportCard.headteacherRemark ??
              ""
            }
            initialPromotionStatus={
              reportCard.promotionStatus ??
              "pending"
            }
            status={
              reportCard.status
            }
          />
        </div>

        {/* SIGN-OFF */}

        <div className="mt-6 print:hidden">
          <SignOffInformation
            classTeacherSignedAt={
              reportCard.classTeacherSignedAt
            }
            headteacherSignedAt={
              reportCard.headteacherSignedAt
            }
          />
        </div>
      </div>
    </div>
  );
}

/* ================================================================
   REPORT CARD STATUS
================================================================ */

function ReportCardStatusBadge({
  status,
}: {
  status:
    | "draft"
    | "teacher_review"
    | "headteacher_review"
    | "approved";
}) {
  const styles = {
    draft:
      "bg-slate-100 text-slate-700",

    teacher_review:
      "bg-amber-100 text-amber-800",

    headteacher_review:
      "bg-blue-100 text-blue-800",

    approved:
      "bg-emerald-100 text-emerald-800",
  };

  const labels = {
    draft:
      "Draft",

    teacher_review:
      "Teacher Review",

    headteacher_review:
      "Headteacher Review",

    approved:
      "Approved",
  };

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold ${styles[status]}`}
    >
      <span
        className="h-2 w-2 rounded-full bg-current"
        aria-hidden="true"
      />

      {labels[status]}
    </span>
  );
}

/* ================================================================
   SIGN-OFF INFORMATION
================================================================ */

function SignOffInformation({
  classTeacherSignedAt,
  headteacherSignedAt,
}: {
  classTeacherSignedAt: Date | null;
  headteacherSignedAt: Date | null;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
            Class teacher sign-off
          </p>

          <p className="mt-2 text-sm font-semibold text-slate-900">
            {classTeacherSignedAt
              ? formatDate(
                  classTeacherSignedAt,
                )
              : "Not signed"}
          </p>
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
            Headteacher sign-off
          </p>

          <p className="mt-2 text-sm font-semibold text-slate-900">
            {headteacherSignedAt
              ? formatDate(
                  headteacherSignedAt,
                )
              : "Not signed"}
          </p>
        </div>
      </div>
    </section>
  );
}

/* ================================================================
   DATE FORMATTER
================================================================ */

function formatDate(date: Date) {
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