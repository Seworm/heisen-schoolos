import Link from "next/link";
import {
  and,
  desc,
  eq,
} from "drizzle-orm";

import { db } from "@/db";
import {
  academicYears,
  assessmentPeriods,
  assessments,
  assessmentTypes,
  classLevels,
  streams,
  subjects,
  terms,
} from "@/db/schema";
import { requireCurrentSchool } from "@/lib/current-school";

export const dynamic = "force-dynamic";

export default async function AssessmentsPage() {
  const school =
    await requireCurrentSchool();

  const [currentYear] =
    await db
      .select()
      .from(academicYears)
      .where(
        and(
          eq(
            academicYears.schoolId,
            school.id,
          ),
          eq(
            academicYears.isCurrent,
            true,
          ),
        ),
      )
      .limit(1);

  const recentAssessments =
    await db
      .select({
        id: assessments.id,
        name: assessments.name,
        maxScore:
          assessments.maxScore,
        status:
          assessments.status,
        assessmentDate:
          assessments.assessmentDate,

        typeName:
          assessmentTypes.name,

        subjectName:
          subjects.name,

        streamName:
          streams.name,

        className:
          classLevels.name,

        termName:
          terms.name,

        periodName:
          assessmentPeriods.name,
      })
      .from(assessments)
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
      .where(
        eq(
          assessments.schoolId,
          school.id,
        ),
      )
      .orderBy(
        desc(
          assessments.createdAt,
        ),
      )
      .limit(20);

  return (
    <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
      <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">
            Academic Management
          </p>

          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
            Assessments & Exams
          </h1>

          <p className="mt-2 max-w-2xl text-sm text-slate-500">
            Create assessments, enter student scores and prepare the
            foundation for results and report cards.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href="/assessments/types"
            className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Assessment types
          </Link>

          <Link
            href="/assessments/periods"
            className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Assessment periods
          </Link>

          <Link
            href="/assessments/new"
            className="rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
          >
            New assessment
          </Link>
          <Link
  href="/assessments/grading"
  className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
>
  Grading schemes
</Link>
        </div>
      </div>

      {currentYear ? (
        <div className="mb-8 rounded-xl border border-slate-200 bg-white p-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Current academic year
          </p>

          <p className="mt-2 text-lg font-semibold text-slate-950">
            {currentYear.name}
          </p>
        </div>
      ) : (
        <div className="mb-8 rounded-xl border border-amber-200 bg-amber-50 p-6">
          <p className="font-semibold text-amber-950">
            No current academic year
          </p>

          <p className="mt-1 text-sm text-amber-800">
            Set a current academic year before creating assessments.
          </p>

          <Link
            href="/academics/years"
            className="mt-4 inline-flex rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white"
          >
            Manage academic years
          </Link>
        </div>
      )}

      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">
            Recent assessments
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Recently created assessments across the school.
          </p>
        </div>
      </div>

      {recentAssessments.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-10 text-center">
          <h3 className="font-semibold text-slate-900">
            No assessments yet
          </h3>

          <p className="mt-2 text-sm text-slate-500">
            Create your first assessment to begin recording scores.
          </p>

          <Link
            href="/assessments/new"
            className="mt-5 inline-flex rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white"
          >
            Create assessment
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Assessment
                  </th>

                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Class
                  </th>

                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Subject
                  </th>

                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Score
                  </th>

                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Status
                  </th>

                  <th className="px-6 py-3" />
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {recentAssessments.map(
                  (assessment) => (
                    <tr
                      key={
                        assessment.id
                      }
                      className="hover:bg-slate-50"
                    >
                      <td className="px-6 py-4">
                        <p className="text-sm font-semibold text-slate-900">
                          {assessment.name}
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          {
                            assessment.typeName
                          }{" "}
                          ·{" "}
                          {
                            assessment.periodName
                          }
                        </p>
                      </td>

                      <td className="px-6 py-4 text-sm text-slate-600">
                        {
                          assessment.className
                        }{" "}
                        {
                          assessment.streamName
                        }
                      </td>

                      <td className="px-6 py-4 text-sm text-slate-600">
                        {
                          assessment.subjectName
                        }
                      </td>

                      <td className="px-6 py-4 text-sm text-slate-600">
                        {assessment.maxScore}
                      </td>

                      <td className="px-6 py-4">
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium capitalize text-slate-600">
                          {
                            assessment.status
                          }
                        </span>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/assessments/${assessment.id}`}
                          className="text-sm font-semibold text-slate-900 hover:underline"
                        >
                          Enter scores →
                        </Link>
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

