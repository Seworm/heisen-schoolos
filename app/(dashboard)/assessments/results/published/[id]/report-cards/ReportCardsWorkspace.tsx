"use client";

import Link from "next/link";
import {
  useMemo,
  useState,
  useTransition,
} from "react";

import {
  approveAllReadyReportCards,
  approveSelectedReportCards,
  ensureReportCards,
  sendAllToHeadteacher,
  sendSelectedToHeadteacher,
  submitAllDraftReportCards,
  submitSelectedReportCards,
} from "./actions";

type ReportCardStatus =
  | "draft"
  | "teacher_review"
  | "headteacher_review"
  | "approved";

type Student = {
  reportCardId: string;
  status: ReportCardStatus;
  classTeacherRemark: string | null;
  headteacherRemark: string | null;
  promotionStatus:
    | "pending"
    | "promoted"
    | "promoted_with_conditions"
    | "repeated"
    | "withdrawn"
    | "transferred";
  classTeacherSignedAt: Date | null;
  headteacherSignedAt: Date | null;

  studentSnapshotId: string;
  studentId: string;
  studentNumber: string;
  name: string;
  overallPercentage: number;
  position: number;
};

type Props = {
  publication: {
    id: string;
    academicYearName: string;
    termName: string;
    className: string;
    streamName: string;
  };
  students: Student[];
};

const STATUS_LABELS: Record<
  ReportCardStatus,
  string
> = {
  draft: "Draft",
  teacher_review: "Teacher Review",
  headteacher_review:
    "Headteacher Review",
  approved: "Approved",
};

export default function ReportCardsWorkspace({
  publication,
  students,
}: Props) {
  const [rows, setRows] =
    useState(students);

  const [search, setSearch] =
    useState("");

  const [selected, setSelected] =
    useState<Set<string>>(
      new Set(),
    );

  const [
    isPending,
    startTransition,
  ] = useTransition();

  const [message, setMessage] =
    useState<{
      type: "success" | "error";
      text: string;
    } | null>(null);

  const counts = useMemo(() => {
    return {
      total: rows.length,
      draft: rows.filter(
        (row) =>
          row.status === "draft",
      ).length,
      teacherReview: rows.filter(
        (row) =>
          row.status ===
          "teacher_review",
      ).length,
      headteacherReview:
        rows.filter(
          (row) =>
            row.status ===
            "headteacher_review",
        ).length,
      approved: rows.filter(
        (row) =>
          row.status === "approved",
      ).length,
    };
  }, [rows]);

  const filteredRows = useMemo(() => {
    const query =
      search.trim().toLowerCase();

    if (!query) {
      return rows;
    }

    return rows.filter((row) => {
      return (
        row.name
          .toLowerCase()
          .includes(query) ||
        row.studentNumber
          .toLowerCase()
          .includes(query)
      );
    });
  }, [rows, search]);

  const selectedRows =
    filteredRows.filter((row) =>
      selected.has(
        row.reportCardId,
      ),
    );

  const selectedStatuses =
    new Set(
      selectedRows.map(
        (row) => row.status,
      ),
    );

  const allFilteredSelected =
    filteredRows.length > 0 &&
    filteredRows.every((row) =>
      selected.has(
        row.reportCardId,
      ),
    );

  function setResult(
    result: {
      success: boolean;
      message: string;
    },
  ) {
    setMessage({
      type: result.success
        ? "success"
        : "error",
      text: result.message,
    });
  }

  function refreshFromServer() {
    window.location.reload();
  }

  function toggleSelection(
    reportCardId: string,
  ) {
    setSelected((current) => {
      const next = new Set(current);

      if (next.has(reportCardId)) {
        next.delete(reportCardId);
      } else {
        next.add(reportCardId);
      }

      return next;
    });
  }

  function toggleAllFiltered() {
    setSelected((current) => {
      const next = new Set(current);

      if (allFilteredSelected) {
        filteredRows.forEach(
          (row) =>
            next.delete(
              row.reportCardId,
            ),
        );
      } else {
        filteredRows.forEach(
          (row) =>
            next.add(
              row.reportCardId,
            ),
        );
      }

      return next;
    });
  }

  function runAction(
    action: () => Promise<{
      success: boolean;
      message: string;
    }>,
  ) {
    setMessage(null);

    startTransition(async () => {
      const result =
        await action();

      setResult(result);

      if (result.success) {
        refreshFromServer();
      }
    });
  }

  function handleEnsure() {
    runAction(() =>
      ensureReportCards(
        publication.id,
      ),
    );
  }

  function handleSubmitAll() {
    if (counts.draft === 0) {
      setMessage({
        type: "error",
        text:
          "There are no draft report cards.",
      });
      return;
    }

    if (
      !window.confirm(
        `Submit all ${counts.draft} draft report cards for teacher review?`,
      )
    ) {
      return;
    }

    runAction(() =>
      submitAllDraftReportCards(
        publication.id,
      ),
    );
  }

  function handleSendAll() {
    if (
      counts.teacherReview === 0
    ) {
      setMessage({
        type: "error",
        text:
          "There are no report cards awaiting teacher review.",
      });
      return;
    }

    if (
      !window.confirm(
        `Send all ${counts.teacherReview} teacher-review report cards to the headteacher?`,
      )
    ) {
      return;
    }

    runAction(() =>
      sendAllToHeadteacher(
        publication.id,
      ),
    );
  }

  function handleApproveAll() {
    if (
      counts.headteacherReview ===
      0
    ) {
      setMessage({
        type: "error",
        text:
          "There are no report cards ready for approval.",
      });
      return;
    }

    if (
      !window.confirm(
        `Approve all ${counts.headteacherReview} ready report cards? This will mark them officially approved.`,
      )
    ) {
      return;
    }

    runAction(() =>
      approveAllReadyReportCards(
        publication.id,
      ),
    );
  }

  function handleSubmitSelected() {
    const ids = selectedRows
      .filter(
        (row) =>
          row.status === "draft",
      )
      .map(
        (row) =>
          row.reportCardId,
      );

    if (ids.length === 0) {
      setMessage({
        type: "error",
        text:
          "Select draft report cards to submit.",
      });
      return;
    }

    runAction(() =>
      submitSelectedReportCards(
        publication.id,
        ids,
      ),
    );
  }

  function handleSendSelected() {
    const ids = selectedRows
      .filter(
        (row) =>
          row.status ===
          "teacher_review",
      )
      .map(
        (row) =>
          row.reportCardId,
      );

    if (ids.length === 0) {
      setMessage({
        type: "error",
        text:
          "Select teacher-review report cards to send.",
      });
      return;
    }

    runAction(() =>
      sendSelectedToHeadteacher(
        publication.id,
        ids,
      ),
    );
  }

  function handleApproveSelected() {
    const ids = selectedRows
      .filter(
        (row) =>
          row.status ===
          "headteacher_review",
      )
      .map(
        (row) =>
          row.reportCardId,
      );

    if (ids.length === 0) {
      setMessage({
        type: "error",
        text:
          "Select report cards awaiting headteacher approval.",
      });
      return;
    }

    if (
      !window.confirm(
        `Approve ${ids.length} selected report card${
          ids.length === 1
            ? ""
            : "s"
        }?`,
      )
    ) {
      return;
    }

    runAction(() =>
      approveSelectedReportCards(
        publication.id,
        ids,
      ),
    );
  }

  const hasReportCards =
    rows.length > 0;

  return (
    <div className="space-y-6">
      {message && (
        <div
          className={`rounded-2xl border px-4 py-3 text-sm font-semibold ${
            message.type ===
            "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          {message.text}
        </div>
      )}

      {!hasReportCards ? (
        <EmptyState
          pending={isPending}
          onCreate={handleEnsure}
        />
      ) : (
        <>
          <SummaryCards
            counts={counts}
          />

          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-lg font-black text-slate-950">
                    Report Card Workflow
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    {publication.className}{" "}
                    {publication.streamName}
                    {" · "}
                    {publication.termName}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {counts.draft >
                    0 && (
                    <ActionButton
                      disabled={
                        isPending
                      }
                      onClick={
                        handleSubmitAll
                      }
                    >
                      Submit All for Review
                    </ActionButton>
                  )}

                  {counts.teacherReview >
                    0 && (
                    <ActionButton
                      disabled={
                        isPending
                      }
                      onClick={
                        handleSendAll
                      }
                    >
                      Send All to Headteacher
                    </ActionButton>
                  )}

                  {counts.headteacherReview >
                    0 && (
                    <ActionButton
                      primary
                      disabled={
                        isPending
                      }
                      onClick={
                        handleApproveAll
                      }
                    >
                      Approve All Ready
                    </ActionButton>
                  )}
                </div>
              </div>
            </div>

            <div className="border-b border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                    <input
                      type="checkbox"
                      checked={
                        allFilteredSelected
                      }
                      onChange={
                        toggleAllFiltered
                      }
                      className="h-4 w-4 rounded border-slate-300"
                    />

                    Select visible
                  </label>

                  {selected.size >
                    0 && (
                    <span className="rounded-full bg-slate-900 px-2.5 py-1 text-xs font-bold text-white">
                      {selected.size}{" "}
                      selected
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={
                      isPending ||
                      selected.size ===
                        0
                    }
                    onClick={
                      handleSubmitSelected
                    }
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Submit Selected
                  </button>

                  <button
                    type="button"
                    disabled={
                      isPending ||
                      selected.size ===
                        0
                    }
                    onClick={
                      handleSendSelected
                    }
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Send Selected
                  </button>

                  <button
                    type="button"
                    disabled={
                      isPending ||
                      selected.size ===
                        0
                    }
                    onClick={
                      handleApproveSelected
                    }
                    className="rounded-lg bg-slate-950 px-3 py-2 text-xs font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Approve Selected
                  </button>
                </div>
              </div>
            </div>

            <div className="border-b border-slate-200 p-4">
              <input
                type="search"
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value,
                  )
                }
                placeholder="Search student name or number..."
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
              />
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50">
                  <tr>
                    <th className="w-12 px-4 py-3">
                      <span className="sr-only">
                        Select
                      </span>
                    </th>

                    <th className="px-4 py-3 text-xs font-black uppercase tracking-wider text-slate-400">
                      Pos.
                    </th>

                    <th className="px-4 py-3 text-xs font-black uppercase tracking-wider text-slate-400">
                      Student
                    </th>

                    <th className="px-4 py-3 text-xs font-black uppercase tracking-wider text-slate-400">
                      Overall
                    </th>

                    <th className="px-4 py-3 text-xs font-black uppercase tracking-wider text-slate-400">
                      Status
                    </th>

                    <th className="px-4 py-3 text-right text-xs font-black uppercase tracking-wider text-slate-400">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredRows.map(
                    (row) => (
                      <tr
                        key={
                          row.reportCardId
                        }
                        className="transition hover:bg-slate-50"
                      >
                        <td className="px-4 py-4">
                          <input
                            type="checkbox"
                            checked={selected.has(
                              row.reportCardId,
                            )}
                            onChange={() =>
                              toggleSelection(
                                row.reportCardId,
                              )
                            }
                            className="h-4 w-4 rounded border-slate-300"
                          />
                        </td>

                        <td className="px-4 py-4 font-bold text-slate-500">
                          {row.position}
                        </td>

                        <td className="px-4 py-4">
                          <div className="font-bold text-slate-900">
                            {row.name}
                          </div>

                          <div className="mt-0.5 text-xs text-slate-400">
                            {row.studentNumber}
                          </div>
                        </td>

                        <td className="px-4 py-4 font-black text-slate-900">
                          {formatNumber(
                            row.overallPercentage,
                          )}
                          %
                        </td>

                        <td className="px-4 py-4">
                          <StatusBadge
                            status={
                              row.status
                            }
                          />
                        </td>

                        <td className="px-4 py-4 text-right">
                          <Link
                            href={`/assessments/results/published/${publication.id}/students/${row.studentSnapshotId}/report-card`}
                            className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-100"
                          >
                            Open
                          </Link>
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>

            {filteredRows.length ===
              0 && (
              <div className="px-6 py-12 text-center">
                <p className="font-bold text-slate-900">
                  No students found
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  Try another search.
                </p>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <strong>Approval safety:</strong>{" "}
            bulk approval only affects report cards
            currently in{" "}
            <strong>Headteacher Review</strong>.
            Draft, teacher-review and already-approved
            report cards are not modified.
          </div>
        </>
      )}
    </div>
  );
}

function SummaryCards({
  counts,
}: {
  counts: {
    total: number;
    draft: number;
    teacherReview: number;
    headteacherReview: number;
    approved: number;
  };
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      <SummaryCard
        label="Total"
        value={counts.total}
      />

      <SummaryCard
        label="Draft"
        value={counts.draft}
      />

      <SummaryCard
        label="Teacher Review"
        value={
          counts.teacherReview
        }
      />

      <SummaryCard
        label="Headteacher Review"
        value={
          counts.headteacherReview
        }
      />

      <SummaryCard
        label="Approved"
        value={counts.approved}
      />
    </div>
  );
}

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-wider text-slate-400">
        {label}
      </p>

      <p className="mt-2 text-3xl font-black tracking-tight text-slate-950">
        {value}
      </p>
    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: ReportCardStatus;
}) {
  const styles: Record<
    ReportCardStatus,
    string
  > = {
    draft:
      "border-slate-200 bg-slate-50 text-slate-600",
    teacher_review:
      "border-blue-200 bg-blue-50 text-blue-700",
    headteacher_review:
      "border-amber-200 bg-amber-50 text-amber-700",
    approved:
      "border-emerald-200 bg-emerald-50 text-emerald-700",
  };

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${styles[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

function ActionButton({
  children,
  onClick,
  disabled,
  primary = false,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled: boolean;
  primary?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={
        primary
          ? "rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          : "rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
      }
    >
      {disabled
        ? "Processing..."
        : children}
    </button>
  );
}

function EmptyState({
  pending,
  onCreate,
}: {
  pending: boolean;
  onCreate: () => void;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center shadow-sm">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-2xl">
        📄
      </div>

      <h2 className="mt-5 text-xl font-black text-slate-950">
        Report cards have not been generated
      </h2>

      <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">
        Generate the report-card workflow for every
        student in this published result. Existing
        academic results will remain untouched.
      </p>

      <button
        type="button"
        disabled={pending}
        onClick={onCreate}
        className="mt-6 rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending
          ? "Generating..."
          : "Generate All Report Cards"}
      </button>
    </div>
  );
}

function formatNumber(
  value: number,
) {
  return Number.isInteger(value)
    ? String(value)
    : value.toFixed(2);
}