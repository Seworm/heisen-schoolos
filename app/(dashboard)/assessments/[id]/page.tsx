import Link from "next/link";
import { and, asc, eq } from "drizzle-orm";

import { db } from "@/db";
import {
  academicYears,
  assessmentPeriods,
  assessmentScores,
  assessments,
  assessmentTypes,
  classLevels,
  studentEnrollments,
  studentPlacements,
  students,
  streams,
  subjects,
  terms,
} from "@/db/schema";
import { requireCurrentSchool } from "@/lib/current-school";
import {
  calculateAssessmentResult,
  calculateAverage,
} from "@/lib/grading";

import AssessmentLifecycle from "./AssessmentLifecycle";
import ScoreEntry from "./ScoreEntry";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function AssessmentPage({
  params,
}: Props) {
  const { id } = await params;

  const school =
    await requireCurrentSchool();

  const [assessment] = await db
    .select({
      id: assessments.id,
      name: assessments.name,
      maxScore: assessments.maxScore,
      assessmentDate:
        assessments.assessmentDate,
      status: assessments.status,
      instructions:
        assessments.instructions,

      academicYearId:
        assessments.academicYearId,
      academicYearName:
        academicYears.name,

      termId: assessments.termId,
      termName: terms.name,

      assessmentPeriodId:
        assessments.assessmentPeriodId,
      periodName:
        assessmentPeriods.name,

      assessmentTypeId:
        assessments.assessmentTypeId,
      typeName:
        assessmentTypes.name,
      typeCategory:
        assessmentTypes.category,

      subjectId:
        assessments.subjectId,
      subjectName:
        subjects.name,

      streamId: streams.id,
      streamName: streams.name,

      classLevelId:
        classLevels.id,
      className:
        classLevels.name,
      classCategory:
        classLevels.category,
    })
    .from(assessments)
    .innerJoin(
      academicYears,
      eq(
        assessments.academicYearId,
        academicYears.id,
      ),
    )
    .innerJoin(
      terms,
      eq(
        assessments.termId,
        terms.id,
      ),
    )
    .innerJoin(
      assessmentPeriods,
      eq(
        assessments.assessmentPeriodId,
        assessmentPeriods.id,
      ),
    )
    .innerJoin(
      assessmentTypes,
      eq(
        assessments.assessmentTypeId,
        assessmentTypes.id,
      ),
    )
    .innerJoin(
      subjects,
      eq(
        assessments.subjectId,
        subjects.id,
      ),
    )
    .innerJoin(
      streams,
      eq(
        assessments.streamId,
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
          assessments.id,
          id,
        ),
        eq(
          assessments.schoolId,
          school.id,
        ),
      ),
    )
    .limit(1);

  if (!assessment) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-10 lg:px-8">
        <div className="rounded-xl border border-red-200 bg-red-50 p-8">
          <h1 className="text-xl font-semibold text-red-950">
            Assessment not found
          </h1>

          <p className="mt-2 text-sm text-red-700">
            The assessment does not exist or
            does not belong to this school.
          </p>

          <Link
            href="/assessments"
            className="mt-6 inline-flex rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Back to assessments
          </Link>
        </div>
      </div>
    );
  }

  const studentsInStream =
    await db
      .select({
        id: students.id,
        studentNumber:
          students.studentNumber,
        firstName:
          students.firstName,
        middleName:
          students.middleName,
        lastName:
          students.lastName,
      })
      .from(studentPlacements)
      .innerJoin(
        studentEnrollments,
        eq(
          studentPlacements.studentEnrollmentId,
          studentEnrollments.id,
        ),
      )
      .innerJoin(
        students,
        eq(
          studentEnrollments.studentId,
          students.id,
        ),
      )
      .where(
        and(
          eq(
            studentPlacements.streamId,
            assessment.streamId,
          ),
          eq(
            studentPlacements.status,
            "active",
          ),
          eq(
            studentEnrollments.academicYearId,
            assessment.academicYearId,
          ),
          eq(
            studentEnrollments.status,
            "active",
          ),
          eq(
            students.schoolId,
            school.id,
          ),
        ),
      )
      .orderBy(
        asc(students.lastName),
        asc(students.firstName),
        asc(students.studentNumber),
      );

  const scores = await db
    .select({
      studentId:
        assessmentScores.studentId,
      score:
        assessmentScores.score,
      comment:
        assessmentScores.comment,
    })
    .from(assessmentScores)
    .where(
      eq(
        assessmentScores.assessmentId,
        assessment.id,
      ),
    );

  const maximumScore = Number(
    assessment.maxScore,
  );


  const results = scores
    .map((score) => {
      const numericScore =
        Number(score.score);

      return {
        studentId:
          score.studentId,
        ...calculateAssessmentResult(
          numericScore,
          maximumScore,
        ),
      };
    })
    .sort(
      (a, b) =>
        b.percentage -
        a.percentage,
    );

  const averagePercentage =
    calculateAverage(
      results.map(
        (result) =>
          result.percentage,
      ),
    );

  const highestPercentage =
    results.length > 0
      ? results[0].percentage
      : 0;

  const lowestPercentage =
    results.length > 0
      ? results[
          results.length - 1
        ].percentage
      : 0;

  const gradeDistribution =
    results.reduce<
      Record<string, number>
    >((distribution, result) => {
      distribution[result.grade] =
        (distribution[
          result.grade
        ] ?? 0) + 1;

      return distribution;
    }, {});

  const studentCount =
    studentsInStream.length;

  const scoreCount =
    scores.length;

  const completionPercentage =
    studentCount > 0
      ? Math.round(
          (scoreCount /
            studentCount) *
            100,
        )
      : 0;

  const locked =
    assessment.status === "closed" ||
    assessment.status === "published" ||
    assessment.status === "archived";

  return (
    <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
      <div className="mb-6">
        <Link
          href="/assessments"
          className="text-sm font-medium text-slate-500 transition hover:text-slate-900"
        >
          ← Back to assessments
        </Link>
      </div>

      <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium capitalize text-slate-600">
              {assessment.classCategory}
            </span>

            <span className="text-sm text-slate-400">
              {assessment.academicYearName}
            </span>

            <span className="text-slate-300">
              ·
            </span>

            <span className="text-sm text-slate-400">
              {assessment.termName}
            </span>
          </div>

          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
            {assessment.name}
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            {assessment.className}{" "}
            {assessment.streamName}
            {" · "}
            {assessment.subjectName}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div
            className={[
              "rounded-full px-3 py-1.5 text-xs font-semibold capitalize",
              assessment.status ===
                "published"
                ? "bg-emerald-50 text-emerald-700"
                : assessment.status ===
                    "closed"
                  ? "bg-amber-50 text-amber-700"
                  : assessment.status ===
                      "archived"
                    ? "bg-slate-200 text-slate-600"
                    : assessment.status ===
                        "open"
                      ? "bg-blue-50 text-blue-700"
                      : "bg-slate-100 text-slate-600",
            ].join(" ")}
          >
            {assessment.status}
          </div>

          <div className="rounded-xl border border-slate-200 bg-white px-5 py-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Maximum score
            </p>

            <p className="mt-1 text-lg font-semibold text-slate-950">
              {maximumScore}
            </p>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <AssessmentLifecycle
          assessmentId={
            assessment.id
          }
          status={
            assessment.status
          }
          scoreCount={
            scoreCount
          }
          studentCount={
            studentCount
          }
        />
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Assessment type
          </p>

          <p className="mt-2 font-semibold text-slate-900">
            {assessment.typeName}
          </p>

          <p className="mt-1 text-xs capitalize text-slate-400">
            {
              assessment.typeCategory.replace(
                "_",
                " ",
              )
            }
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Assessment period
          </p>

          <p className="mt-2 font-semibold text-slate-900">
            {assessment.periodName}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Assessment date
          </p>

          <p className="mt-2 font-semibold text-slate-900">
            {assessment.assessmentDate ??
              "Not specified"}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Score completion
          </p>

          <p className="mt-2 font-semibold text-slate-900">
            {scoreCount} /{" "}
            {studentCount}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            {completionPercentage}%
            entered
          </p>
        </div>
      </div>

      {assessment.instructions && (
        <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50 p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
            Instructions
          </p>

          <p className="mt-2 text-sm leading-6 text-blue-900">
            {assessment.instructions}
          </p>
        </div>
      )}

      {scores.length > 0 && (
        <div className="mb-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-slate-950">
              Performance summary
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Results for students with scores
              entered for this assessment.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Class average
              </p>

              <p className="mt-2 text-2xl font-semibold text-slate-950">
                {averagePercentage}%
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Highest
              </p>

              <p className="mt-2 text-2xl font-semibold text-slate-950">
                {highestPercentage}%
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Lowest
              </p>

              <p className="mt-2 text-2xl font-semibold text-slate-950">
                {lowestPercentage}%
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Students scored
              </p>

              <p className="mt-2 text-2xl font-semibold text-slate-950">
                {scoreCount}
              </p>
            </div>
          </div>
        </div>
      )}

      {scores.length > 0 && (
        <div className="mb-6 overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="font-semibold text-slate-950">
              Grade distribution
            </h2>
          </div>

          <div className="grid grid-cols-2 divide-x divide-slate-200 sm:grid-cols-3 lg:grid-cols-6">
            {[
              "A",
              "B",
              "C",
              "D",
              "E",
              "F",
            ].map((grade) => (
              <div
                key={grade}
                className="p-5"
              >
                <p className="text-2xl font-semibold text-slate-950">
                  {gradeDistribution[
                    grade
                  ] ?? 0}
                </p>

                <p className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-400">
                  Grade {grade}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mb-6">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-slate-950">
            Score entry
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Enter raw scores. Percentages and
            grades are calculated automatically.
          </p>
        </div>

        <ScoreEntry
          assessmentId={
            assessment.id
          }
          maxScore={
            maximumScore
          }
          students={
            studentsInStream
          }
          scores={scores}
          locked={locked}
        />
      </div>

      {scores.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="font-semibold text-slate-950">
              Results
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Assessment-level performance and
              ranking.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Position
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Student
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Score
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Percentage
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Grade
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Remark
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {results.map(
                  (result, index) => {
                    const student =
                      studentsInStream.find(
                        (item) =>
                          item.id ===
                          result.studentId,
                      );

                    if (!student) {
                      return null;
                    }

                    return (
                      <tr
                        key={
                          result.studentId
                        }
                      >
                        <td className="px-5 py-4 text-sm font-semibold text-slate-900">
                          {index + 1}
                        </td>

                        <td className="px-5 py-4">
                          <p className="text-sm font-medium text-slate-900">
                            {
                              student.lastName
                            }
                            ,{" "}
                            {
                              student.firstName
                            }{" "}
                            {
                              student.middleName ??
                              ""
                            }
                          </p>

                          <p className="mt-0.5 text-xs text-slate-400">
                            {
                              student.studentNumber
                            }
                          </p>
                        </td>

                        <td className="px-5 py-4 text-sm text-slate-700">
                          {result.score.toFixed(
                            2,
                          )}{" "}
                          /{" "}
                          {maximumScore}
                        </td>

                        <td className="px-5 py-4 text-sm font-medium text-slate-900">
                          {
                            result.percentage
                          }
                          %
                        </td>

                        <td className="px-5 py-4">
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                            {result.grade}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-sm text-slate-500">
                          {
                            result.remark
                          }
                        </td>
                      </tr>
                    );
                  },
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

