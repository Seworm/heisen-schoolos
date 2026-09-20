import { and, desc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { auth } from "@/../auth";
import { db } from "@/db";
import {
  academicYears,
  resultPublicationAssessments,
  resultPublicationStudents,
  resultPublicationSubjects,
  resultPublications,
  students,
  terms,
} from "@/db/schema";

export default async function StudentResultsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/student/login");
  }

  if (session.user.accountType !== "student") {
    redirect("/dashboard");
  }

  const studentResult = await db
    .select({
      id: students.id,
      firstName: students.firstName,
      middleName: students.middleName,
      lastName: students.lastName,
      studentNumber: students.studentNumber,
    })
    .from(students)
    .where(eq(students.id, session.user.id))
    .limit(1);

  const student = studentResult[0];

  if (!student) {
    redirect("/student/login");
  }

  const publishedResults = await db
    .select({
      publicationId: resultPublications.id,
      academicYear: academicYears.name,
      termName: terms.name,
      publishedAt: resultPublications.publishedAt,
      publicationStudentId: resultPublicationStudents.id,
      overallPercentage: resultPublicationStudents.overallPercentage,
      position: resultPublicationStudents.position,
      subjectId: resultPublicationSubjects.subjectId,
      subjectName: resultPublicationSubjects.subjectName,
      classScore: resultPublicationSubjects.classScore,
      examinationScore: resultPublicationSubjects.examinationScore,
      finalPercentage: resultPublicationSubjects.finalPercentage,
      grade: resultPublicationSubjects.grade,
      label: resultPublicationSubjects.label,
      remark: resultPublicationSubjects.remark,
      assessmentName: resultPublicationAssessments.assessmentName,
      assessmentTypeName:
        resultPublicationAssessments.assessmentTypeName,
      category: resultPublicationAssessments.category,
      score: resultPublicationAssessments.score,
      maxScore: resultPublicationAssessments.maxScore,
      percentage: resultPublicationAssessments.percentage,
    })
    .from(resultPublicationStudents)
    .innerJoin(
      resultPublications,
      and(
        eq(
          resultPublicationStudents.publicationId,
          resultPublications.id,
        ),
        eq(resultPublications.status, "published"),
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
      eq(resultPublications.termId, terms.id),
    )
    .innerJoin(
      resultPublicationSubjects,
      eq(
        resultPublicationSubjects.publicationStudentId,
        resultPublicationStudents.id,
      ),
    )
    .leftJoin(
      resultPublicationAssessments,
      eq(
        resultPublicationAssessments.publicationSubjectId,
        resultPublicationSubjects.id,
      ),
    )
    .where(
      eq(resultPublicationStudents.studentId, student.id),
    )
    .orderBy(
      desc(resultPublications.publishedAt),
      resultPublicationSubjects.subjectName,
      resultPublicationAssessments.assessmentName,
    );

  const fullName = [
    student.firstName,
    student.middleName,
    student.lastName,
  ]
    .filter(Boolean)
    .join(" ");

  const publicationGroups = groupByPublication(
    publishedResults,
  );

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
      <section>
        <p className="text-sm font-medium text-slate-500">
          Academic Records
        </p>

        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
          My Results
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          View your published academic results and performance.
        </p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <InfoField label="Student" value={fullName} />

          <InfoField
            label="Student Number"
            value={student.studentNumber}
          />

          <InfoField
            label="Published Results"
            value={String(publicationGroups.length)}
          />

          <InfoField
            label="Status"
            value={
              publicationGroups.length > 0
                ? "Published"
                : "No results"
            }
          />
        </div>
      </section>

      {publicationGroups.length === 0 ? (
        <section className="rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center shadow-sm">
          <h2 className="font-semibold text-slate-950">
            No published results
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Your school has not published any results for you yet.
          </p>
        </section>
      ) : (
        <div className="space-y-6">
          {publicationGroups.map((publication) => (
            <section
              key={publication.publicationId}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
            >
              <div className="border-b border-slate-200 bg-slate-50 px-6 py-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                      Published Result
                    </p>

                    <h2 className="mt-1 text-lg font-semibold text-slate-950">
                      {publication.academicYear} ·{" "}
                      {publication.termName}
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      {publication.subjects.length} subject
                      {publication.subjects.length === 1
                        ? ""
                        : "s"} available
                    </p>
                  </div>

                  <div className="flex gap-6">
                    <SummaryStat
                      label="Overall"
                      value={`${publication.overallPercentage}%`}
                    />

                    <SummaryStat
                      label="Position"
                      value={`#${publication.position}`}
                    />
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[850px] text-left text-sm">
                  <thead className="bg-white text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-6 py-4 font-medium">
                        Subject
                      </th>

                      <th className="px-6 py-4 text-right font-medium">
                        Class Score
                      </th>

                      <th className="px-6 py-4 text-right font-medium">
                        Examination
                      </th>

                      <th className="px-6 py-4 text-right font-medium">
                        Final
                      </th>

                      <th className="px-6 py-4 font-medium">
                        Grade
                      </th>

                      <th className="px-6 py-4 font-medium">
                        Remark
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-200">
                    {publication.subjects.map((subject) => (
                      <tr key={subject.subjectId}>
                        <td className="px-6 py-4">
                          <p className="font-semibold text-slate-900">
                            {subject.subjectName}
                          </p>

                          {subject.label && (
                            <p className="mt-1 text-xs text-slate-500">
                              {subject.label}
                            </p>
                          )}
                        </td>

                        <td className="px-6 py-4 text-right text-slate-700">
                          {subject.classScore}
                        </td>

                        <td className="px-6 py-4 text-right text-slate-700">
                          {subject.examinationScore}
                        </td>

                        <td className="px-6 py-4 text-right font-semibold text-slate-900">
                          {subject.finalPercentage}
                        </td>

                        <td className="px-6 py-4">
                          <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                            {subject.grade ?? "—"}
                          </span>
                        </td>

                        <td className="px-6 py-4 text-slate-600">
                          {subject.remark ?? "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="border-t border-slate-200 px-6 py-5">
                <h3 className="text-sm font-semibold text-slate-950">
                  Assessment Breakdown
                </h3>

                <div className="mt-4 space-y-4">
                  {publication.subjects.map((subject) => (
                    <div
                      key={`${subject.subjectId}-assessments`}
                      className="rounded-xl border border-slate-200"
                    >
                      <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
                        <p className="text-sm font-semibold text-slate-900">
                          {subject.subjectName}
                        </p>
                      </div>

                      {subject.assessments.length === 0 ? (
                        <p className="px-4 py-4 text-sm text-slate-500">
                          No assessment breakdown available.
                        </p>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full min-w-[650px] text-left text-sm">
                            <thead className="text-xs uppercase tracking-wide text-slate-400">
                              <tr>
                                <th className="px-4 py-3 font-medium">
                                  Assessment
                                </th>

                                <th className="px-4 py-3 font-medium">
                                  Type
                                </th>

                                <th className="px-4 py-3 text-right font-medium">
                                  Score
                                </th>

                                <th className="px-4 py-3 text-right font-medium">
                                  Max
                                </th>

                                <th className="px-4 py-3 text-right font-medium">
                                  %
                                </th>
                              </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-100">
                              {subject.assessments.map(
                                (assessment, index) => (
                                  <tr
                                    key={`${assessment.assessmentName}-${index}`}
                                  >
                                    <td className="px-4 py-3 font-medium text-slate-800">
                                      {assessment.assessmentName}
                                    </td>

                                    <td className="px-4 py-3 text-slate-500">
                                      {assessment.assessmentTypeName}
                                    </td>

                                    <td className="px-4 py-3 text-right text-slate-700">
                                      {assessment.score}
                                    </td>

                                    <td className="px-4 py-3 text-right text-slate-500">
                                      {assessment.maxScore}
                                    </td>

                                    <td className="px-4 py-3 text-right font-medium text-slate-800">
                                      {assessment.percentage}
                                    </td>
                                  </tr>
                                ),
                              )}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </section>
          ))}
        </div>
      )}
    </main>
  );
}

type RawResult = {
  publicationId: string;
  academicYear: string;
  termName: string;
  publishedAt: Date | null;
  publicationStudentId: string;
  overallPercentage: string;
  position: number;
  subjectId: string;
  subjectName: string;
  classScore: string;
  examinationScore: string;
  finalPercentage: string;
  grade: string | null;
  label: string | null;
  remark: string | null;
  assessmentName: string | null;
  assessmentTypeName: string | null;
  category: string | null;
  score: string | null;
  maxScore: string | null;
  percentage: string | null;
};

function groupByPublication(results: RawResult[]) {
  const publications = new Map<
    string,
    {
      publicationId: string;
      academicYear: string;
      termName: string;
      publishedAt: Date | null;
      overallPercentage: string;
      position: number;
      subjects: Map<
        string,
        {
          subjectId: string;
          subjectName: string;
          classScore: string;
          examinationScore: string;
          finalPercentage: string;
          grade: string | null;
          label: string | null;
          remark: string | null;
          assessments: {
            assessmentName: string;
            assessmentTypeName: string;
            category: string;
            score: string;
            maxScore: string;
            percentage: string;
          }[];
        }
      >;
    }
  >();

  for (const result of results) {
    if (!publications.has(result.publicationId)) {
      publications.set(result.publicationId, {
        publicationId: result.publicationId,
        academicYear: result.academicYear,
        termName: result.termName,
        publishedAt: result.publishedAt,
        overallPercentage: result.overallPercentage,
        position: result.position,
        subjects: new Map(),
      });
    }

    const publication = publications.get(result.publicationId)!;

    if (!publication.subjects.has(result.subjectId)) {
      publication.subjects.set(result.subjectId, {
        subjectId: result.subjectId,
        subjectName: result.subjectName,
        classScore: result.classScore,
        examinationScore: result.examinationScore,
        finalPercentage: result.finalPercentage,
        grade: result.grade,
        label: result.label,
        remark: result.remark,
        assessments: [],
      });
    }

    const subject = publication.subjects.get(result.subjectId)!;

    if (
      result.assessmentName &&
      result.assessmentTypeName &&
      result.category &&
      result.score !== null &&
      result.maxScore !== null &&
      result.percentage !== null
    ) {
      subject.assessments.push({
        assessmentName: result.assessmentName,
        assessmentTypeName: result.assessmentTypeName,
        category: result.category,
        score: result.score,
        maxScore: result.maxScore,
        percentage: result.percentage,
      });
    }
  }

  return Array.from(publications.values()).map(
    (publication) => ({
      ...publication,
      subjects: Array.from(publication.subjects.values()),
    }),
  );
}

function InfoField({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-sm font-semibold text-slate-900">
        {value}
      </p>
    </div>
  );
}

function SummaryStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="text-right">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-lg font-semibold text-slate-950">
        {value}
      </p>
    </div>
  );
}


