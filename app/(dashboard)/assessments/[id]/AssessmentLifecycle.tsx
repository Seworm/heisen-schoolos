"use client";

import { useActionState } from "react";

import {
  transitionAssessment,
} from "./actions";

type AssessmentStatus =
  | "draft"
  | "open"
  | "closed"
  | "published"
  | "archived";

type Props = {
  assessmentId: string;
  status: AssessmentStatus;
  scoreCount: number;
  studentCount: number;
};

const initialState = {
  error: "",
};

const transitionMap: Record<
  AssessmentStatus,
  {
    target: AssessmentStatus | null;
    label: string;
    description: string;
  }
> = {
  draft: {
    target: "open",
    label: "Open assessment",
    description:
      "Allow score entry and active marking.",
  },
  open: {
    target: "closed",
    label: "Close assessment",
    description:
      "Lock scores and prepare the assessment for publication.",
  },
  closed: {
    target: "published",
    label: "Publish results",
    description:
      "Make the completed assessment an official published result.",
  },
  published: {
    target: "archived",
    label: "Archive assessment",
    description:
      "Move the published assessment into the historical archive.",
  },
  archived: {
    target: null,
    label: "",
    description:
      "This assessment is permanently archived.",
  },
};

const statusDescription: Record<
  AssessmentStatus,
  string
> = {
  draft:
    "The assessment is being prepared. Scores can still be entered.",
  open:
    "The assessment is open for score entry.",
  closed:
    "Score entry is locked. The assessment is ready for publication.",
  published:
    "Results have been published and cannot be edited.",
  archived:
    "This assessment has been archived.",
};

export default function AssessmentLifecycle({
  assessmentId,
  status,
  scoreCount,
  studentCount,
}: Props) {
  const [state, formAction, pending] =
    useActionState(
      transitionAssessment,
      initialState,
    );

  const transition =
    transitionMap[status];

  const incomplete =
    studentCount > 0 &&
    scoreCount < studentCount;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Assessment lifecycle
          </p>

          <p className="mt-2 text-sm font-medium capitalize text-slate-900">
            {status}
          </p>

          <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
            {
              statusDescription[
                status
              ]
            }
          </p>
        </div>

        {transition.target && (
          <form action={formAction}>
            <input
              type="hidden"
              name="assessmentId"
              value={assessmentId}
            />

            <input
              type="hidden"
              name="targetStatus"
              value={transition.target}
            />

            <button
              type="submit"
              disabled={
                pending ||
                (transition.target ===
                  "published" &&
                  incomplete)
              }
              className="rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {pending
                ? "Updating..."
                : transition.label}
            </button>
          </form>
        )}
      </div>

      {transition.target && (
        <p className="mt-4 text-xs text-slate-400">
          Next stage:{" "}
          <span className="font-semibold capitalize text-slate-600">
            {transition.target}
          </span>
          {" · "}
          {transition.description}
        </p>
      )}

      {status === "closed" &&
        incomplete && (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {scoreCount} of{" "}
            {studentCount} students have scores.
            Complete score entry before publishing.
          </div>
        )}

      {state.error && (
        <div
          role="alert"
          className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {state.error}
        </div>
      )}
    </div>
  );
}