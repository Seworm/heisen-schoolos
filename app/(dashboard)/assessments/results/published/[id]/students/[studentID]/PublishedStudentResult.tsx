"use client";

import { useMemo, useState } from "react";

import type {
  PublishedStudentResultData,
  PublishedStudentSubject,
} from "./page";

type Props = {
  result: PublishedStudentResultData;
};

export default function PublishedStudentResult({
  result,
}: Props) {
  const [showAssessments, setShowAssessments] =
    useState(false);

  const subjectAverage = useMemo(() => {
    if (result.subjects.length === 0) {
      return 0;
    }

    const total = result.subjects.reduce(
      (sum, subject) =>
        sum + subject.finalPercentage,
      0,
    );

    return roundToTwoDecimals(
      total / result.subjects.length,
    );
  }, [result.subjects]);

  return (
    <div className="space-y-8">
      {/* ========================================================
          STUDENT SUMMARY
          ======================================================== */}

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
              Student information
            </p>

            <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <InfoItem
                label="Student"
                value={formatStudentName(
                  result.student,
                )}
              />

              <InfoItem
                label="Student number"
                value={
                  result.student
                    .studentNumber
                }
              />

              <InfoItem
                label="Class"
                value={`${result.publication.className} • ${result.publication.streamName}`}
              />

              <InfoItem
                label="Academic period"
                value={`${result.publication.academicYearName} • ${result.publication.termName}`}
              />
            </div>
          </div>

          <div className="rounded-2xl bg-slate-950 px-7 py-5 text-white lg:min-w-[220px]">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
              Overall result
            </p>

            <p className="mt-2 text-4xl font-bold tracking-tight">
              {result.student.overallPercentage.toFixed(
                2,
              )}
              %
            </p>

            <div className="mt-3 flex items-center justify-between gap-4">
              <span className="text-sm text-slate-400">
                Position
              </span>

              <span className="text-sm font-bold text-white">
                {formatPosition(
                  result.student.position,
                )}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          PERFORMANCE SUMMARY
          ======================================================== */}

      <div className="grid gap-4 sm:grid-cols-3">
        <SummaryCard
          label="Subjects"
          value={result.subjects.length}
          description="Published subjects"
        />

        <SummaryCard
          label="Subject average"
          value={`${subjectAverage.toFixed(2)}%`}
          description="Average of subject final scores"
        />

        <SummaryCard
          label="Overall position"
          value={formatPosition(
            result.student.position,
          )}
          description="Published class position"
        />
      </div>

      {/* ========================================================
          SUBJECT RESULTS
          ======================================================== */}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-slate-950">
              Subject results
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Official scores preserved at publication.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              setShowAssessments(
                (current) => !current,
              )
            }
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
          >
            {showAssessments
              ? "Hide assessment details"
              : "Show assessment details"}
          </button>
        </div>

        {/* ======================================================
            DESKTOP TABLE
            ====================================================== */}

        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[1000px]">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/80">
                <th className="w-16 px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-400">
                  Pos.
                </th>

                <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-400">
                  Subject
                </th>

                <th className="px-5 py-3 text-right text-xs font-bold uppercase tracking-wide text-slate-400">
                  Class /50
                </th>

                <th className="px-5 py-3 text-right text-xs font-bold uppercase tracking-wide text-slate-400">
                  Exam /50
                </th>

                <th className="px-5 py-3 text-right text-xs font-bold uppercase tracking-wide text-slate-400">
                  Final /100
                </th>

                <th className="px-5 py-3 text-center text-xs font-bold uppercase tracking-wide text-slate-400">
                  Grade
                </th>

                <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-400">
                  Remark
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {result.subjects.map(
                (subject) => (
                  <SubjectRow
                    key={subject.id}
                    subject={subject}
                  />
                ),
              )}
            </tbody>
          </table>
        </div>

        {/* ======================================================
            MOBILE SUBJECT CARDS
            ====================================================== */}

        <div className="divide-y divide-slate-100 md:hidden">
          {result.subjects.map(
            (subject) => (
              <SubjectCard
                key={subject.id}
                subject={subject}
              />
            ),
          )}
        </div>
      </section>

      {/* ========================================================
          ASSESSMENT BREAKDOWN
          ======================================================== */}

      {showAssessments ? (
        <AssessmentBreakdown
          subjects={result.subjects}
        />
      ) : null}
    </div>
  );
}

function SubjectRow({
  subject,
}: {
  subject: PublishedStudentSubject;
}) {
  return (
    <tr className="transition hover:bg-slate-50/70">
      <td className="px-5 py-4">
        <span className="inline-flex min-w-9 items-center justify-center rounded-lg bg-slate-100 px-2 py-1.5 text-xs font-bold text-slate-700">
          {subject.position}
        </span>
      </td>

      <td className="px-5 py-4">
        <p className="text-sm font-semibold text-slate-900">
          {subject.subjectName}
        </p>
      </td>

      <td className="px-5 py-4 text-right">
        <span className="text-sm font-semibold text-slate-700">
          {subject.classScore.toFixed(2)}
        </span>
      </td>

      <td className="px-5 py-4 text-right">
        <span className="text-sm font-semibold text-slate-700">
          {subject.examinationScore.toFixed(
            2,
          )}
        </span>
      </td>

      <td className="px-5 py-4 text-right">
        <span className="text-sm font-bold text-slate-950">
          {subject.finalPercentage.toFixed(
            2,
          )}
        </span>
      </td>

      <td className="px-5 py-4 text-center">
        <GradeBadge
          grade={subject.grade}
        />
      </td>

      <td className="px-5 py-4">
        <div>
          {subject.label ? (
            <p className="text-sm font-semibold text-slate-700">
              {subject.label}
            </p>
          ) : null}

          {subject.remark ? (
            <p className="text-xs text-slate-500">
              {subject.remark}
            </p>
          ) : null}
        </div>
      </td>
    </tr>
  );
}

function SubjectCard({
  subject,
}: {
  subject: PublishedStudentSubject;
}) {
  return (
    <article className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <span className="inline-flex h-8 min-w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 px-2 text-xs font-bold text-slate-700">
            {subject.position}
          </span>

          <div className="min-w-0">
            <h3 className="truncate text-sm font-bold text-slate-950">
              {subject.subjectName}
            </h3>

            {subject.label ? (
              <p className="mt-1 text-xs text-slate-500">
                {subject.label}
              </p>
            ) : null}
          </div>
        </div>

        <GradeBadge
          grade={subject.grade}
        />
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <ScoreBox
          label="Class"
          value={`${subject.classScore.toFixed(2)}/50`}
        />

        <ScoreBox
          label="Exam"
          value={`${subject.examinationScore.toFixed(2)}/50`}
        />

        <ScoreBox
          label="Final"
          value={`${subject.finalPercentage.toFixed(2)}`}
        />
      </div>

      {subject.remark ? (
        <div className="mt-3 rounded-xl bg-slate-50 px-3 py-2.5">
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
            Remark
          </p>

          <p className="mt-1 text-xs text-slate-600">
            {subject.remark}
          </p>
        </div>
      ) : null}
    </article>
  );
}

function AssessmentBreakdown({
  subjects,
}: {
  subjects: PublishedStudentSubject[];
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="border-b border-slate-100 pb-5">
        <h2 className="text-lg font-bold tracking-tight text-slate-950">
          Assessment breakdown
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          The individual assessment values preserved in
          the published snapshot.
        </p>
      </div>

      <div className="mt-5 space-y-5">
        {subjects.map((subject) => (
          <div
            key={subject.id}
            className="overflow-hidden rounded-xl border border-slate-200"
          >
            <div className="border-b border-slate-100 bg-slate-50 px-4 py-3">
              <h3 className="text-sm font-bold text-slate-900">
                {subject.subjectName}
              </h3>
            </div>

            {subject.assessments.length ===
            0 ? (
              <div className="px-4 py-5 text-sm text-slate-500">
                No individual assessment snapshots
                were stored for this subject.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[750px]">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-slate-400">
                        Assessment
                      </th>

                      <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-slate-400">
                        Category
                      </th>

                      <th className="px-4 py-3 text-right text-[11px] font-bold uppercase tracking-wide text-slate-400">
                        Score
                      </th>

                      <th className="px-4 py-3 text-right text-[11px] font-bold uppercase tracking-wide text-slate-400">
                        %
                      </th>

                      <th className="px-4 py-3 text-right text-[11px] font-bold uppercase tracking-wide text-slate-400">
                        Weight
                      </th>

                      <th className="px-4 py-3 text-right text-[11px] font-bold uppercase tracking-wide text-slate-400">
                        Contribution
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {subject.assessments.map(
                      (assessment) => (
                        <tr
                          key={
                            assessment.id
                          }
                        >
                          <td className="px-4 py-3">
                            <p className="text-sm font-medium text-slate-800">
                              {
                                assessment.assessmentName
                              }
                            </p>

                            <p className="mt-0.5 text-xs text-slate-400">
                              {
                                assessment.assessmentTypeName
                              }
                            </p>
                          </td>

                          <td className="px-4 py-3">
                            <CategoryBadge
                              category={
                                assessment.category
                              }
                            />
                          </td>

                          <td className="px-4 py-3 text-right text-sm font-semibold text-slate-700">
                            {formatNumber(
                              assessment.score,
                            )}{" "}
                            /{" "}
                            {formatNumber(
                              assessment.maxScore,
                            )}
                          </td>

                          <td className="px-4 py-3 text-right text-sm text-slate-600">
                            {formatNumber(
                              assessment.percentage,
                            )}
                            %
                          </td>

                          <td className="px-4 py-3 text-right text-sm text-slate-600">
                            {formatNumber(
                              assessment.weightPercent,
                            )}
                            %
                          </td>

                          <td className="px-4 py-3 text-right text-sm font-bold text-slate-900">
                            {formatNumber(
                              assessment.weightedContribution,
                            )}
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
    </section>
  );
}

function InfoItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-sm font-semibold text-slate-800">
        {value}
      </p>
    </div>
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

function ScoreBox({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <p className="text-[9px] font-bold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-xs font-bold text-slate-800">
        {value}
      </p>
    </div>
  );
}

function GradeBadge({
  grade,
}: {
  grade: string | null;
}) {
  return (
    <span
      className={`inline-flex min-w-10 items-center justify-center rounded-lg px-2.5 py-1.5 text-xs font-bold ${
        grade === "A"
          ? "bg-emerald-100 text-emerald-700"
          : grade === "B"
            ? "bg-blue-100 text-blue-700"
            : grade === "C"
              ? "bg-amber-100 text-amber-700"
              : grade === "D"
                ? "bg-orange-100 text-orange-700"
                : grade === "E"
                  ? "bg-slate-100 text-slate-700"
                  : "bg-red-100 text-red-700"
      }`}
    >
      {grade || "—"}
    </span>
  );
}

function CategoryBadge({
  category,
}: {
  category:
    | "continuous_assessment"
    | "examination";
}) {
  const examination =
    category === "examination";

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ${
        examination
          ? "bg-violet-100 text-violet-700"
          : "bg-sky-100 text-sky-700"
      }`}
    >
      {examination
        ? "Examination"
        : "Continuous assessment"}
    </span>
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

function formatPosition(position: number) {
  if (
    position % 100 >= 11 &&
    position % 100 <= 13
  ) {
    return `${position}th`;
  }

  switch (position % 10) {
    case 1:
      return `${position}st`;
    case 2:
      return `${position}nd`;
    case 3:
      return `${position}rd`;
    default:
      return `${position}th`;
  }
}

function formatNumber(value: number) {
  return Number.isInteger(value)
    ? String(value)
    : value.toFixed(2);
}

function roundToTwoDecimals(value: number) {
  return Math.round(value * 100) / 100;
}