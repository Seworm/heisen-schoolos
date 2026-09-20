"use client";

import Link from "next/link";
import { useTransition } from "react";

import {
  cancelAttendanceSession,
  reopenAttendanceSession,
} from "./actions";

type AttendanceSessionActionsProps = {
  sessionId: string;
  status: "open" | "completed" | "cancelled";
  streamId: string;
  attendanceDate: string;
};

export default function AttendanceSessionActions({
  sessionId,
  status,
  streamId,
  attendanceDate,
}: AttendanceSessionActionsProps) {
  const [pending, startTransition] = useTransition();

  function handleCancel() {
    const confirmed = window.confirm(
      "Cancel this attendance session? Its records will be preserved, but the session will no longer be active.",
    );

    if (!confirmed) return;

    startTransition(async () => {
      await cancelAttendanceSession(sessionId);
    });
  }

  function handleReopen() {
    const confirmed = window.confirm(
      "Reopen this attendance session so it can be edited?",
    );

    if (!confirmed) return;

    startTransition(async () => {
      await reopenAttendanceSession(sessionId);
    });
  }

  const editHref = `/attendance/take?streamId=${encodeURIComponent(
    streamId,
  )}&date=${encodeURIComponent(attendanceDate)}`;

  if (status === "cancelled") {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={handleReopen}
          disabled={pending}
          className="inline-flex items-center justify-center rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? "Reopening..." : "Reopen session"}
        </button>

        <Link
          href="/attendance"
          className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Back to attendance
        </Link>
      </div>
    );
  }

  if (status === "completed") {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <Link
          href={editHref}
          className="inline-flex items-center justify-center rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          Edit attendance
        </Link>

        <button
          type="button"
          onClick={handleReopen}
          disabled={pending}
          className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? "Reopening..." : "Reopen"}
        </button>

        <Link
          href="/attendance"
          className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Back
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Link
        href={editHref}
        className="inline-flex items-center justify-center rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
      >
        Edit attendance
      </Link>

      <button
        type="button"
        onClick={handleCancel}
        disabled={pending}
        className="inline-flex items-center justify-center rounded-lg border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? "Cancelling..." : "Cancel session"}
      </button>

      <Link
        href="/attendance"
        className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
      >
        Back
      </Link>
    </div>
  );
}
