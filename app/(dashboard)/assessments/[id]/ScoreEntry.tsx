"use client";

import { useActionState } from "react";

import {
  calculateAssessmentResult,
} from "@/lib/grading";

import {
  saveAssessmentScores,
} from "./actions";

type Student = {
  id: string;
  studentNumber: string;
  firstName: string;
  middleName: string | null;
  lastName: string;
};

type Score = {
  studentId: string;
  score: string;
  comment: string | null;
};

type Props = {
  assessmentId: string;
  maxScore: number;
  students: Student[];
  scores: Score[];
  locked: boolean;
};

const initialState = {
  error: "",
};

export default function ScoreEntry({
  assessmentId,
  maxScore,
  students,
  scores,
  locked,
}: Props) {
  const [state, formAction, pending] =
    useActionState(
      saveAssessmentScores,
      initialState,
    );

  const scoreMap = new Map(
    scores.map((score) => [
      score.studentId,
      score,
    ]),
  );

  return (
    <form action={formAction}>
      <input
        type="hidden"
        name="assessmentId"
        value={assessmentId}
      />

      {state.error && (
        <div
          role="alert"
          className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {state.error}
        </div>
      )}

      {locked && (
        <div className="mb-5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          This assessment is locked. Scores can
          no longer be edited.
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  #
                </th>

                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Student
                </th>

                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Score / {maxScore}
                </th>

                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Result
                </th>

                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Comment
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {students.map(
                (student, index) => {
                  const existing =
                    scoreMap.get(
                      student.id,
                    );

                  const numericScore =
                    existing
                      ? Number(
                          existing.score,
                        )
                      : null;

                  const result =
                    numericScore !== null &&
                    Number.isFinite(
                      numericScore,
                    )
                      ? calculateAssessmentResult(
                          numericScore,
                          maxScore,
                        )
                      : null;

                  return (
                    <tr
                      key={
                        student.id
                      }
                    >
                      <td className="px-5 py-4 text-sm text-slate-400">
                        {index + 1}
                      </td>

                      <td className="px-5 py-4">
                        <p className="text-sm font-medium text-slate-900">
                          {student.lastName},{" "}
                          {
                            student.firstName
                          }{" "}
                          {student.middleName ??
                            ""}
                        </p>

                        <p className="mt-0.5 text-xs text-slate-400">
                          {
                            student.studentNumber
                          }
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <input
                          name={`score_${student.id}`}
                          type="number"
                          min="0"
                          max={maxScore}
                          step="0.01"
                          defaultValue={
                            existing?.score ??
                            ""
                          }
                          disabled={
                            locked
                          }
                          className="w-28 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:bg-slate-100"
                        />
                      </td>

                      <td className="px-5 py-4">
                        {result ? (
                          <div>
                            <p className="text-sm font-semibold text-slate-900">
                              {
                                result.percentage
                              }
                              %
                            </p>

                            <p className="mt-0.5 text-xs text-slate-500">
                              Grade{" "}
                              {
                                result.grade
                              }{" "}
                              ·{" "}
                              {
                                result.remark
                              }
                            </p>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">
                            Not scored
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <input
                          name={`comment_${student.id}`}
                          defaultValue={
                            existing?.comment ??
                            ""
                          }
                          disabled={
                            locked
                          }
                          maxLength={1000}
                          placeholder="Optional"
                          className="w-full min-w-48 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:bg-slate-100"
                        />
                      </td>
                    </tr>
                  );
                },
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-slate-500">
              {students.length} students
            </p>

            <p className="mt-1 text-xs text-slate-400">
              {scores.length} scores currently
              entered
            </p>
          </div>

          {!locked && (
            <button
              type="submit"
              disabled={pending}
              className="rounded-lg bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {pending
                ? "Saving..."
                : "Save scores"}
            </button>
          )}
        </div>
      </div>
    </form>
  );
}