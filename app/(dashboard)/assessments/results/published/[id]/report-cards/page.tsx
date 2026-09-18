import Link from "next/link";
import { and, asc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";

import { db } from "@/db";
import {
  academicYears,
  classLevels,
  reportCards,
  resultPublicationStudents,
  resultPublications,
  streams,
  terms,
} from "@/db/schema";
import { requireCurrentSchool } from "@/lib/current-school";

import ReportCardsWorkspace from "./ReportCardsWorkspace";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ReportCardsPage({
  params,
}: PageProps) {
  const { id: publicationId } = await params;

  const school = await requireCurrentSchool();

  const [publication] = await db
    .select({
      id: resultPublications.id,
      status: resultPublications.status,
      academicYearId:
        resultPublications.academicYearId,
      termId: resultPublications.termId,
      streamId: resultPublications.streamId,

      academicYearName: academicYears.name,
      termName: terms.name,
      streamName: streams.name,
      className: classLevels.name,
      classCategory: classLevels.category,
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
      ),
    )
    .limit(1);

  if (!publication) {
    notFound();
  }

  if (publication.status !== "published") {
    notFound();
  }

  const rows = await db
    .select({
      reportCardId: reportCards.id,
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

      studentSnapshotId:
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
    .from(reportCards)
    .innerJoin(
      resultPublicationStudents,
      eq(
        resultPublicationStudents.id,
        reportCards.publicationStudentId,
      ),
    )
    .where(
      and(
        eq(
          reportCards.schoolId,
          school.id,
        ),
        eq(
          reportCards.publicationId,
          publication.id,
        ),
      ),
    )
    .orderBy(
      asc(
        resultPublicationStudents.position,
      ),
      asc(
        resultPublicationStudents.studentNumber,
      ),
    );

  const students = rows.map((row) => ({
    reportCardId: row.reportCardId,
    status: row.status,
    classTeacherRemark:
      row.classTeacherRemark,
    headteacherRemark:
      row.headteacherRemark,
    promotionStatus:
      row.promotionStatus,
    classTeacherSignedAt:
      row.classTeacherSignedAt,
    headteacherSignedAt:
      row.headteacherSignedAt,

    studentSnapshotId:
      row.studentSnapshotId,
    studentId: row.studentId,
    studentNumber:
      row.studentNumber,
    name: [
      row.firstName,
      row.middleName,
      row.lastName,
    ]
      .filter(Boolean)
      .join(" "),
    overallPercentage:
      Number(row.overallPercentage),
    position: row.position,
  }));

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm text-slate-500">
              <Link
                href="/assessments/results/published"
                className="transition hover:text-slate-900"
              >
                Published Results
              </Link>

              <span>/</span>

              <span>Report Cards</span>
            </div>

            <h1 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
              Report Card Control Centre
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Manage, review and approve report cards
              for this published result.
            </p>
          </div>

          <Link
            href={`/assessments/results/published/${publication.id}`}
            className="inline-flex w-fit items-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            ← Published Results
          </Link>
        </div>

        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="grid gap-4 sm:grid-cols-4">
            <ContextItem
              label="Academic Year"
              value={publication.academicYearName}
            />

            <ContextItem
              label="Term"
              value={publication.termName}
            />

            <ContextItem
              label="Class"
              value={publication.className}
            />

            <ContextItem
              label="Stream"
              value={publication.streamName}
            />
          </div>
        </div>

        <ReportCardsWorkspace
          publication={{
            id: publication.id,
            academicYearName:
              publication.academicYearName,
            termName:
              publication.termName,
            className:
              publication.className,
            streamName:
              publication.streamName,
          }}
          students={students}
        />
      </div>
    </div>
  );
}

function ContextItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-sm font-bold text-slate-900">
        {value}
      </p>
    </div>
  );
}