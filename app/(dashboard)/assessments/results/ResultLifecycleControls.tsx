"use client";

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";

import {
  markResultsReady,
  publishResults,
  type ResultActionState,
} from "./actions";

const initialState: ResultActionState = {
  success: false,
  message: "",
};

type PublicationStatus =
  | "draft"
  | "ready"
  | "published"
  | "archived";

type Props = {
  academicYearId: string;
  termId: string;
  streamId: string;
  publication: {
    id: string;
    status: PublicationStatus;
    publishedAt: Date | null;
    gradingSchemeId: string | null;
  } | null;
};

export default function ResultLifecycleControls({
  academicYearId,
  termId,
  streamId,
  publication,
}: Props) {
  const router = useRouter();

  const [readyState, readyAction] = useActionState(
    markResultsReady,
    initialState,
  );

  const [publishState, publishAction] = useActionState(
    publishResults,
    initialState,
  );

  /*
   * The database is the source of truth.
   *
   * If no publication record exists, the result set is still
   * considered DRAFT.
   */
  const status: PublicationStatus =
    publication?.status ?? "draft";

  const isDraft = status === "draft";
  const isReady = status === "ready";
  const isPublished = status === "published";
  const isArchived = status === "archived";

  /*
   * Refresh the server-rendered page after a successful action.
   *
   * This causes page.tsx to query result_publications again,
   * ensuring the lifecycle display reflects the persisted
   * database state rather than temporary client state.
   */
  useEffect(() => {
    if (
      readyState.success ||
      publishState.success
    ) {
      router.refresh();
    }
  }, [
    readyState.success,
    publishState.success,
    router,
  ]);

  /*
   * Prefer the most recent action message.
   *
   * publishState is checked first because publication is the
   * later lifecycle action.
   */
  const resultState =
    publishState.message
      ? publishState
      : readyState;

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* ======================================================
          HEADER
          ====================================================== */}
      <div className="border-b border-slate-100 px-5 py-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                Result lifecycle
              </p>

              <span className="h-1 w-1 rounded-full bg-slate-300" />

              <p className="text-xs font-medium text-slate-400">
                Official result control
              </p>
            </div>

            <h3 className="mt-1 text-lg font-bold tracking-tight text-slate-950">
              Validate and publish results
            </h3>

            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
              Validate the complete result set before
              creating the official historical publication
              record.
            </p>
          </div>

          <StatusBadge status={status} />
        </div>
      </div>

      {/* ======================================================
          BODY
          ====================================================== */}
      <div className="grid gap-6 p-5 lg:grid-cols-[1fr_auto] lg:items-center">
        <div>
          {/* Lifecycle progress */}
          <div className="flex flex-wrap items-center gap-2">
            <LifecycleStep
              label="Draft"
              active={isDraft}
              complete={
                isReady ||
                isPublished ||
                isArchived
              }
            />

            <StepConnector />

            <LifecycleStep
              label="Ready"
              active={isReady}
              complete={
                isPublished ||
                isArchived
              }
            />

            <StepConnector />

            <LifecycleStep
              label="Published"
              active={isPublished}
              complete={isPublished}
            />
          </div>

          {/* Current status description */}
          <StatusDescription
            status={status}
            publishedAt={
              publication?.publishedAt ?? null
            }
          />

          {/* Action feedback */}
          {resultState.message ? (
            <ActionMessage
              success={resultState.success}
              message={resultState.message}
            />
          ) : null}
        </div>

        {/* ====================================================
            ACTIONS
            ==================================================== */}
        <div className="flex min-w-[220px] flex-col gap-2">
          {/* --------------------------------------------------
              DRAFT
              -------------------------------------------------- */}
          {isDraft ? (
            <form action={readyAction}>
              <input
                type="hidden"
                name="academicYearId"
                value={academicYearId}
              />

              <input
                type="hidden"
                name="termId"
                value={termId}
              />

              <input
                type="hidden"
                name="streamId"
                value={streamId}
              />

              <SubmitButton
                label="Validate & mark ready"
                pendingLabel="Validating..."
              />
            </form>
          ) : null}

          {/* --------------------------------------------------
              READY
              -------------------------------------------------- */}
          {isReady ? (
            <form action={publishAction}>
              <input
                type="hidden"
                name="academicYearId"
                value={academicYearId}
              />

              <input
                type="hidden"
                name="termId"
                value={termId}
              />

              <input
                type="hidden"
                name="streamId"
                value={streamId}
              />

              <SubmitButton
                label="Publish results"
                pendingLabel="Publishing..."
                primary
              />
            </form>
          ) : null}

          {/* --------------------------------------------------
              PUBLISHED
              -------------------------------------------------- */}
          {isPublished ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
              <div className="flex items-center justify-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-[11px] font-bold text-white">
                  ✓
                </span>

                <span className="text-sm font-semibold text-emerald-800">
                  Results locked
                </span>
              </div>

              <p className="mt-1 text-center text-xs text-emerald-700">
                This result set has been officially
                published and cannot be edited through
                the live result workspace.
              </p>
            </div>
          ) : null}

          {/* --------------------------------------------------
              ARCHIVED
              -------------------------------------------------- */}
          {isArchived ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="flex items-center justify-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-500 text-[11px] font-bold text-white">
                  ✓
                </span>

                <span className="text-sm font-semibold text-slate-700">
                  Results archived
                </span>
              </div>

              <p className="mt-1 text-center text-xs text-slate-500">
                This publication has been archived and is
                no longer available for lifecycle changes.
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   STATUS BADGE
   ============================================================ */

function StatusBadge({
  status,
}: {
  status: PublicationStatus;
}) {
  if (status === "published") {
    return (
      <span className="inline-flex w-fit items-center gap-2 rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-bold text-emerald-700">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        Published
      </span>
    );
  }

  if (status === "ready") {
    return (
      <span className="inline-flex w-fit items-center gap-2 rounded-full bg-amber-100 px-3 py-1.5 text-xs font-bold text-amber-700">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
        Ready
      </span>
    );
  }

  if (status === "archived") {
    return (
      <span className="inline-flex w-fit items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600">
        <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
        Archived
      </span>
    );
  }

  return (
    <span className="inline-flex w-fit items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600">
      <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
      Draft
    </span>
  );
}

/* ============================================================
   LIFECYCLE STEP
   ============================================================ */

function LifecycleStep({
  label,
  active,
  complete,
}: {
  label: string;
  active: boolean;
  complete: boolean;
}) {
  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold transition ${
        complete
          ? "bg-emerald-100 text-emerald-700"
          : active
            ? "bg-slate-950 text-white"
            : "bg-slate-100 text-slate-500"
      }`}
    >
      <span
        className={`flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold ${
          complete
            ? "bg-emerald-600 text-white"
            : active
              ? "bg-white text-slate-950"
              : "bg-slate-300 text-slate-600"
        }`}
      >
        {complete ? "✓" : ""}
      </span>

      {label}
    </div>
  );
}

/* ============================================================
   CONNECTOR
   ============================================================ */

function StepConnector() {
  return (
    <span className="hidden h-px w-6 bg-slate-200 sm:block" />
  );
}

/* ============================================================
   STATUS DESCRIPTION
   ============================================================ */

function StatusDescription({
  status,
  publishedAt,
}: {
  status: PublicationStatus;
  publishedAt: Date | null;
}) {
  if (status === "published") {
    return (
      <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50/60 px-4 py-3">
        <p className="text-sm font-semibold text-emerald-800">
          Official results published
        </p>

        <p className="mt-1 text-xs leading-5 text-emerald-700">
          The result snapshot is now the official
          historical record for this class and term.
        </p>

        {publishedAt ? (
          <p className="mt-1 text-xs font-medium text-emerald-600">
            Published{" "}
            {formatPublishedDate(publishedAt)}
          </p>
        ) : null}
      </div>
    );
  }

  if (status === "ready") {
    return (
      <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50/60 px-4 py-3">
        <p className="text-sm font-semibold text-amber-800">
          Results have passed validation
        </p>

        <p className="mt-1 text-xs leading-5 text-amber-700">
          The result set is ready to become the official
          historical publication. Publishing will create
          an immutable snapshot.
        </p>
      </div>
    );
  }

  if (status === "archived") {
    return (
      <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
        <p className="text-sm font-semibold text-slate-700">
          Historical publication archived
        </p>

        <p className="mt-1 text-xs leading-5 text-slate-500">
          This publication is archived and cannot be
          moved through the normal result lifecycle.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
      <p className="text-sm font-semibold text-slate-700">
        Results are still in draft
      </p>

      <p className="mt-1 text-xs leading-5 text-slate-500">
        Validate the result set to confirm that grading,
        scores, weights and grade bands are complete before
        publication.
      </p>
    </div>
  );
}

/* ============================================================
   ACTION MESSAGE
   ============================================================ */

function ActionMessage({
  success,
  message,
}: {
  success: boolean;
  message: string;
}) {
  return (
    <div
      className={`mt-4 rounded-xl border px-4 py-3 text-sm ${
        success
          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
          : "border-red-200 bg-red-50 text-red-800"
      }`}
    >
      <div className="flex items-start gap-2">
        <span
          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
            success
              ? "bg-emerald-600 text-white"
              : "bg-red-600 text-white"
          }`}
        >
          {success ? "✓" : "!"}
        </span>

        <p>{message}</p>
      </div>
    </div>
  );
}

/* ============================================================
   SUBMIT BUTTON
   ============================================================ */

function SubmitButton({
  label,
  pendingLabel,
  primary = false,
}: {
  label: string;
  pendingLabel: string;
  primary?: boolean;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={`w-full rounded-xl px-5 py-2.5 text-sm font-semibold shadow-sm transition disabled:cursor-not-allowed disabled:opacity-60 ${
        primary
          ? "bg-slate-950 text-white hover:bg-slate-800"
          : "border border-slate-200 bg-white text-slate-800 hover:border-slate-300 hover:bg-slate-50"
      }`}
    >
      {pending ? pendingLabel : label}
    </button>
  );
}

/* ============================================================
   DATE FORMATTER
   ============================================================ */

function formatPublishedDate(date: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}