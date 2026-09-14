"use client";
import Link from "next/link";
import { useState, useTransition } from "react";
import { removeGuardian, setPrimaryGuardian } from "./actions";

type GuardianActionsProps = {
  studentId: string;
  guardianId: string;
  isPrimary: boolean;
};

export default function GuardianActions({
  studentId,
  guardianId,
  isPrimary,
}: GuardianActionsProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSetPrimary() {
    setError(null);

    startTransition(async () => {
      const result = await setPrimaryGuardian(
        studentId,
        guardianId,
      );

      if (result.error) {
        setError(result.error);
        return;
      }

      window.location.reload();
    });
  }

  function handleRemove() {
    const confirmed = window.confirm(
      "Remove this guardian from the student's record?\n\nThe guardian's information will not be deleted from the school database.",
    );

    if (!confirmed) {
      return;
    }

    setError(null);

    startTransition(async () => {
      const result = await removeGuardian(
        studentId,
        guardianId,
      );

      if (result.error) {
        setError(result.error);
        return;
      }

      window.location.reload();
    });
  }

  return (
    <div className="flex flex-col items-start gap-2 sm:items-end">
      <div className="flex flex-wrap items-center gap-2">
  <Link
    href={`/students/${studentId}/guardians/${guardianId}/edit`}
    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
  >
    Edit
  </Link>

  {!isPrimary && (
    <button
      type="button"
      onClick={handleSetPrimary}
      disabled={isPending}
      className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {isPending ? "Saving..." : "Set primary"}
    </button>
  )}

  <button
    type="button"
    onClick={handleRemove}
    disabled={isPending}
    className="rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-medium text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
  >
    Remove
  </button>
</div>

      {error && (
        <p
          role="alert"
          className="max-w-xs text-right text-xs text-red-600"
        >
          {error}
        </p>
      )}
    </div>
  );
}