"use client";

import { useMemo, useState } from "react";

import {
  calculateStudentResult,
  calculatePosition,
  type StudentSubjectResultInput,
} from "@/lib/results";
import type { ResultDataset } from "@/lib/result-data";

type Props = {
  dataset: ResultDataset;
};

function formatNumber(value: number) {
  return value.toFixed(2);
}

function getInitials(
  firstName: string,
  lastName: string,
) {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

export default function ResultsWorkspace({
  dataset,
}: Props) {
  const [selectedStudentId, setSelectedStudentId] =
    useState<string | null>(
      dataset.students[0]?.id ?? null,
    );

  const [query, setQuery] = useState("");

  const studentResults = useMemo(() => {
    return dataset.students.map((student) => {
      const subjectMap =
        new Map<string, StudentSubjectResultInput>();

      for (const assessment of dataset.assessments) {
        let subject = subjectMap.get(
          assessment.subjectId,
        );

        if (!subject) {
          subject = {
            subjectId:
              assessment.subjectId,
            subjectName:
              assessment.subjectName,
            assessments: [],
          };

          subjectMap.set(
            assessment.subjectId,
            subject,
          );
        }

        const score = dataset.scores.find(
          (item) =>
            item.studentId === student.id &&
            item.assessmentId === assessment.id,
        );

        if (!score) {
          continue;
        }

        const gradingItem =
          dataset.gradingItems.find(
            (item) =>
              item.assessmentTypeId ===
              assessment.assessmentTypeId,
          );

        subject.assessments.push({
          
          assessmentId:
            assessment.id,
            assessmentTypeName:
  assessment.assessmentTypeName,
          assessmentTypeId:
            assessment.assessmentTypeId,
          assessmentName:
            assessment.name,
          category:
            assessment.category,
          score: score.score,
          maxScore:
            assessment.maxScore,
          weightPercent:
            gradingItem?.weightPercent ?? 0,
        });
      }

      return calculateStudentResult(
        student,
        Array.from(subjectMap.values()),
        dataset.gradeBands.map((band) => ({
          grade: band.grade,
          label: band.label,
          minimumPercent:
            band.minimumPercent,
          maximumPercent:
            band.maximumPercent,
          remark: band.remark,
        })),
      );
    });
  }, [dataset]);

  const ranked = useMemo(() => {
    return calculatePosition(
      studentResults.map((student) => ({
        studentId: student.studentId,
        percentage:
          student.overallPercentage,
      })),
    );
  }, [studentResults]);

  const rankedMap = useMemo(() => {
    return new Map(
      ranked.map((item) => [
        item.studentId,
        item.position,
      ]),
    );
  }, [ranked]);

  const selectedStudent =
    studentResults.find(
      (student) =>
        student.studentId ===
        selectedStudentId,
    ) ??
    studentResults[0] ??
    null;

  const filteredStudents =
    studentResults.filter((student) =>
      `${student.studentNumber} ${student.studentName}`
        .toLowerCase()
        .includes(query.toLowerCase()),
    );

  const classAverage =
    studentResults.length === 0
      ? 0
      : studentResults.reduce(
          (sum, student) =>
            sum + student.overallPercentage,
          0,
        ) / studentResults.length;

  const totalAssessments =
    dataset.assessments.length;

  const totalScores =
    dataset.scores.length;

  const expectedScores =
    dataset.students.length *
    totalAssessments;

  const scoreCompletion =
    expectedScores === 0
      ? 0
      : Math.min(
          100,
          (totalScores / expectedScores) *
            100,
        );

  return (
    <div className="space-y-6">
      {/* Header summary */}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <SummaryCard
          label="Class"
          value={dataset.stream.className}
          detail={dataset.stream.name}
        />

        <SummaryCard
          label="Students"
          value={String(
            dataset.students.length,
          )}
          detail="Active students"
        />

        <SummaryCard
          label="Assessments"
          value={String(totalAssessments)}
          detail="Configured assessments"
        />

        <SummaryCard
          label="Score completion"
          value={`${formatNumber(
            scoreCompletion,
          )}%`}
          detail={`${totalScores} / ${expectedScores} scores`}
        />

        <SummaryCard
          label="Class average"
          value={`${formatNumber(
            classAverage,
          )}%`}
          detail="Final percentage"
        />
      </section>

      {/* Academic context */}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
              Results context
            </p>

            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
                {dataset.academicYear.name}
              </span>

              <span className="text-slate-300">
                /
              </span>

              <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
                {dataset.term.name}
              </span>

              <span className="text-slate-300">
                /
              </span>

              <span className="rounded-full bg-slate-950 px-3 py-1 text-sm font-semibold text-white">
                {dataset.stream.className}{" "}
                {dataset.stream.name}
              </span>
            </div>
          </div>

          <div className="text-left lg:text-right">
            <p className="text-xs font-medium text-slate-400">
              Grading scheme
            </p>

            <p className="mt-1 text-sm font-semibold text-slate-900">
              {dataset.gradingScheme?.name ??
                "No active grading scheme"}
            </p>
          </div>
        </div>
      </section>

      {/* Main workspace */}

      <section className="grid min-h-[650px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:grid-cols-[340px_1fr]">
        {/* Student list */}

        <aside className="border-b border-slate-200 bg-slate-50 lg:border-b-0 lg:border-r">
          <div className="border-b border-slate-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  Students
                </p>

                <p className="mt-0.5 text-xs text-slate-500">
                  {studentResults.length} students
                </p>
              </div>
            </div>

            <div className="mt-4">
              <input
                type="search"
                value={query}
                onChange={(event) =>
                  setQuery(
                    event.target.value,
                  )
                }
                placeholder="Search student..."
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
              />
            </div>
          </div>

          <div className="max-h-[650px] overflow-y-auto p-2">
            {filteredStudents.length ===
            0 ? (
              <div className="px-4 py-10 text-center text-sm text-slate-500">
                No students found.
              </div>
            ) : (
              filteredStudents.map(
                (student) => {
                  const active =
                    selectedStudent?.studentId ===
                    student.studentId;

                  const position =
                    rankedMap.get(
                      student.studentId,
                    );

                  return (
                    <button
                      key={
                        student.studentId
                      }
                      type="button"
                      onClick={() =>
                        setSelectedStudentId(
                          student.studentId,
                        )
                      }
                      className={`mb-1 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition ${
                        active
                          ? "bg-slate-950 text-white"
                          : "hover:bg-white"
                      }`}
                    >
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                          active
                            ? "bg-white/10 text-white"
                            : "bg-white text-slate-600 shadow-sm"
                        }`}
                      >
                        {getInitials(
                          student.studentName.split(
                            " ",
                          )[0] ?? "",
                          student.studentName.split(
                            " ",
                          ).at(-1) ?? "",
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p
                          className={`truncate text-sm font-semibold ${
                            active
                              ? "text-white"
                              : "text-slate-900"
                          }`}
                        >
                          {student.studentName}
                        </p>

                        <p
                          className={`mt-0.5 text-xs ${
                            active
                              ? "text-slate-400"
                              : "text-slate-500"
                          }`}
                        >
                          {student.studentNumber ??
                            "No student number"}
                        </p>
                      </div>

                      {position ? (
                        <span
                          className={`text-xs font-bold ${
                            active
                              ? "text-slate-300"
                              : "text-slate-500"
                          }`}
                        >
                          #{position}
                        </span>
                      ) : null}
                    </button>
                  );
                },
              )
            )}
          </div>
        </aside>

        {/* Student result */}

        <div className="min-w-0">
          {!selectedStudent ? (
            <div className="flex h-full min-h-[500px] items-center justify-center p-8 text-center">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  No student results
                </h2>

                <p className="mt-2 text-sm text-slate-500">
                  There are currently no students in
                  this stream.
                </p>
              </div>
            </div>
          ) : (
            <div>
              {/* Student header */}

              <div className="border-b border-slate-200 p-5 sm:p-6">
                <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                      Student result
                    </p>

                    <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
                      {selectedStudent.studentName}
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      {selectedStudent.studentNumber ??
                        "No student number"}
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-2 sm:gap-3">
                    <ResultMetric
                      label="Position"
                      value={`#${rankedMap.get(
                        selectedStudent.studentId,
                      ) ?? "-"}`}
                    />

                    <ResultMetric
                      label="Average"
                      value={`${formatNumber(
                        selectedStudent.overallPercentage,
                      )}%`}
                    />

                    <ResultMetric
                      label="Subjects"
                      value={String(
                        selectedStudent.subjects
                          .length,
                      )}
                    />
                  </div>
                </div>
              </div>

              {/* Subject results */}

              <div className="overflow-x-auto">
                <table className="w-full min-w-[850px] text-left">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Subject
                      </th>

                      <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Class /50
                      </th>

                      <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Exam /50
                      </th>

                      <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Final /100
                      </th>

                      <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Grade
                      </th>

                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Remark
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {selectedStudent.subjects.map(
                      (subject) => (
                        <tr
                          key={
                            subject.subjectId
                          }
                          className="border-b border-slate-100 last:border-0"
                        >
                          <td className="px-5 py-4">
                            <p className="font-semibold text-slate-900">
                              {
                                subject.subjectName
                              }
                            </p>

                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {subject.assessments.map(
                                (assessment) => (
                                  <span
                                    key={
                                      assessment.assessmentId
                                    }
                                    className="rounded-md bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-500"
                                  >
                                    {
                                      assessment.assessmentName
                                    }{" "}
                                    ·{" "}
                                    {formatNumber(
                                      assessment.score,
                                    )}
                                    /
                                    {formatNumber(
                                      assessment.maxScore,
                                    )}
                                  </span>
                                ),
                              )}
                            </div>
                          </td>

                          <td className="px-5 py-4 text-right font-semibold text-slate-700">
                            {formatNumber(
                              subject.classScore,
                            )}
                          </td>

                          <td className="px-5 py-4 text-right font-semibold text-slate-700">
                            {formatNumber(
                              subject.examinationScore,
                            )}
                          </td>

                          <td className="px-5 py-4 text-right">
                            <span className="font-bold text-slate-950">
                              {formatNumber(
                                subject.finalPercentage,
                              )}
                            </span>
                          </td>

                          <td className="px-5 py-4 text-center">
                            <GradeBadge
                              grade={
                                subject.grade
                                  ?.grade ?? "-"
                              }
                            />
                          </td>

                          <td className="px-5 py-4 text-sm text-slate-500">
                            {subject.grade
                              ?.remark ??
                              "No remark"}
                          </td>
                        </tr>
                      ),
                    )}
                  </tbody>
                </table>
              </div>

              {/* Empty subject state */}

              {selectedStudent.subjects
                .length === 0 ? (
                <div className="border-t border-slate-100 px-6 py-12 text-center">
                  <p className="text-sm font-medium text-slate-700">
                    No scored subjects yet.
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    Enter assessment scores before
                    generating the complete result.
                  </p>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </section>

      {/* Grading breakdown */}

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
              Weighting
            </p>

            <h3 className="mt-1 text-lg font-bold text-slate-950">
              Result composition
            </h3>
          </div>

          <div className="mt-5 space-y-3">
            {dataset.gradingItems.map(
              (item) => (
                <div
                  key={
                    item.assessmentTypeId
                  }
                  className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      {
                        item.assessmentTypeName
                      }
                    </p>

                    <p className="mt-0.5 text-xs text-slate-500">
                      {item.category ===
                      "continuous_assessment"
                        ? "Continuous assessment"
                        : "Examination"}
                    </p>
                  </div>

                  <span className="text-sm font-bold text-slate-950">
                    {formatNumber(
                      item.weightPercent,
                    )}
                    %
                  </span>
                </div>
              ),
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
              Grade bands
            </p>

            <h3 className="mt-1 text-lg font-bold text-slate-950">
              Active grading scale
            </h3>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {dataset.gradeBands.map(
              (band) => (
                <div
                  key={band.id}
                  className="rounded-xl border border-slate-100 bg-slate-50 p-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-slate-950">
                      {band.grade}
                    </span>

                    <span className="text-xs font-semibold text-slate-500">
                      {formatNumber(
                        band.minimumPercent,
                      )}
                      -
                      {formatNumber(
                        band.maximumPercent,
                      )}
                    </span>
                  </div>

                  {band.label ? (
                    <p className="mt-1 text-xs text-slate-500">
                      {band.label}
                    </p>
                  ) : null}
                </div>
              ),
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-2 truncate text-2xl font-bold tracking-tight text-slate-950">
        {value}
      </p>

      <p className="mt-1 truncate text-xs text-slate-500">
        {detail}
      </p>
    </div>
  );
}

function ResultMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-[80px] rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-center">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-sm font-bold text-slate-950">
        {value}
      </p>
    </div>
  );
}

function GradeBadge({
  grade,
}: {
  grade: string;
}) {
  return (
    <span className="inline-flex min-w-9 items-center justify-center rounded-lg bg-slate-950 px-2.5 py-1.5 text-xs font-bold text-white">
      {grade}
    </span>
  );
}