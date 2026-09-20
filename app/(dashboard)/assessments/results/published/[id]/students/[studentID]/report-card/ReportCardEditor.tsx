"use client";

import {
  useState,
  useTransition,
} from "react";

import {
  saveClassTeacherRemark,
  saveHeadteacherRemark,
  savePromotionStatus,
} from "../../../report-cards/individual-actions";

type ReportCardEditorProps = {
  reportCardId: string;
  publicationId: string;
  studentSnapshotId: string;
  initialClassTeacherRemark: string;
  initialHeadteacherRemark: string;
  initialPromotionStatus: string;
  status:
    | "draft"
    | "teacher_review"
    | "headteacher_review"
    | "approved";
};

const promotionOptions = [
  {
    value: "pending",
    label: "Pending school decision",
  },
  {
    value: "promoted",
    label: "Promoted",
  },
  {
    value: "promoted_with_conditions",
    label: "Promoted with conditions",
  },
  {
    value: "repeated",
    label: "Repeated",
  },
  {
    value: "withdrawn",
    label: "Withdrawn",
  },
  {
    value: "transferred",
    label: "Transferred",
  },
] as const;

export default function ReportCardEditor({
  reportCardId,
  initialClassTeacherRemark,
  initialHeadteacherRemark,
  initialPromotionStatus,
  status,
}: ReportCardEditorProps) {
  const [classTeacherRemark, setClassTeacherRemark] =
    useState(initialClassTeacherRemark);

  const [headteacherRemark, setHeadteacherRemark] =
    useState(initialHeadteacherRemark);

  const [promotionStatus, setPromotionStatus] =
    useState(initialPromotionStatus);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  const [isPending, startTransition] =
    useTransition();

  const locked = status === "approved";

  function clearMessages() {
    setMessage("");
    setError("");
  }

  function handleSaveClassTeacherRemark() {
    clearMessages();

    startTransition(async () => {
      const result =
        await saveClassTeacherRemark(
          reportCardId,
          classTeacherRemark,
        );

      if (!result.success) {
        setError(result.message);
        return;
      }

      setMessage(result.message);
    });
  }

  function handleSaveHeadteacherRemark() {
    clearMessages();

    startTransition(async () => {
      const result =
        await saveHeadteacherRemark(
          reportCardId,
          headteacherRemark,
        );

      if (!result.success) {
        setError(result.message);
        return;
      }

      setMessage(result.message);
    });
  }

  function handleSavePromotionStatus() {
    clearMessages();

    startTransition(async () => {
      const result =
        await savePromotionStatus(
          reportCardId,
          promotionStatus,
        );

      if (!result.success) {
        setError(result.message);
        return;
      }

      setMessage(result.message);
    });
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-6 py-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
              Report card workflow
            </p>

            <h2 className="mt-1 text-lg font-bold text-slate-950">
              Remarks & promotion
            </h2>
          </div>

          <StatusBadge status={status} />
        </div>
      </div>

      <div className="space-y-6 p-6">
        {locked ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            This report card has been approved and is
            now locked. Its academic results and
            workflow information should not be edited.
          </div>
        ) : null}

        {message ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
            {message}
          </div>
        ) : null}

        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        ) : null}

        {/* ======================================================
            CLASS TEACHER
        ====================================================== */}

        <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5">
          <div className="mb-4">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
              Class teacher
            </p>

            <h3 className="mt-1 font-bold text-slate-950">
              Class teacher&apos;s remark
            </h3>
          </div>

          <textarea
            value={classTeacherRemark}
            onChange={(event) =>
              setClassTeacherRemark(
                event.target.value,
              )
            }
            disabled={locked || isPending}
            maxLength={1000}
            rows={5}
            placeholder="Enter the class teacher's remark..."
            className="w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100 disabled:cursor-not-allowed disabled:bg-slate-100"
          />

          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-xs text-slate-400">
              {classTeacherRemark.length}/1000
            </span>

            <button
              type="button"
              onClick={
                handleSaveClassTeacherRemark
              }
              disabled={locked || isPending}
              className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isPending
                ? "Saving..."
                : "Save teacher remark"}
            </button>
          </div>
        </div>

        {/* ======================================================
            HEADTEACHER
        ====================================================== */}

        <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5">
          <div className="mb-4">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
              Headteacher
            </p>

            <h3 className="mt-1 font-bold text-slate-950">
              Headteacher&apos;s remark
            </h3>
          </div>

          <textarea
            value={headteacherRemark}
            onChange={(event) =>
              setHeadteacherRemark(
                event.target.value,
              )
            }
            disabled={locked || isPending}
            maxLength={1000}
            rows={5}
            placeholder="Enter the headteacher's remark..."
            className="w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100 disabled:cursor-not-allowed disabled:bg-slate-100"
          />

          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-xs text-slate-400">
              {headteacherRemark.length}/1000
            </span>

            <button
              type="button"
              onClick={
                handleSaveHeadteacherRemark
              }
              disabled={locked || isPending}
              className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isPending
                ? "Saving..."
                : "Save headteacher remark"}
            </button>
          </div>
        </div>

        {/* ======================================================
            PROMOTION
        ====================================================== */}

        <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5">
          <div className="mb-4">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
              Academic progression
            </p>

            <h3 className="mt-1 font-bold text-slate-950">
              Promotion decision
            </h3>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label
                htmlFor="promotion-status"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Promotion status
              </label>

              <select
                id="promotion-status"
                value={promotionStatus}
                onChange={(event) =>
                  setPromotionStatus(
                    event.target.value,
                  )
                }
                disabled={locked || isPending}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100 disabled:cursor-not-allowed disabled:bg-slate-100"
              >
                {promotionOptions.map(
                  (option) => (
                    <option
                      key={option.value}
                      value={option.value}
                    >
                      {option.label}
                    </option>
                  ),
                )}
              </select>
            </div>

            <button
              type="button"
              onClick={
                handleSavePromotionStatus
              }
              disabled={locked || isPending}
              className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isPending
                ? "Saving..."
                : "Save decision"}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function StatusBadge({
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
    draft: "Draft",
    teacher_review:
      "Teacher Review",
    headteacher_review:
      "Headteacher Review",
    approved: "Approved",
  };

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1.5 text-xs font-bold ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}
