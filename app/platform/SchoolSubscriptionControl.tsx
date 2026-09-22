"use client";

import { useState, useTransition } from "react";
import { Loader2, PauseCircle, PlayCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { restoreSchool, suspendSchool } from "./schools/actions";

export default function SchoolSubscriptionControl({
  schoolId,
  status,
}: {
  schoolId: string;
  status: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const suspended = status === "suspended";

  function updateStatus() {
    if (!suspended && !window.confirm("Suspend this school and block all school users until it is restored?")) {
      return;
    }

    setError(null);
    startTransition(async () => {
      try {
        if (suspended) {
          await restoreSchool(schoolId);
        } else {
          await suspendSchool(schoolId);
        }
        router.refresh();
      } catch (actionError) {
        setError(actionError instanceof Error ? actionError.message : "Unable to update school subscription status.");
      }
    });
  }

  if (!["active", "suspended"].includes(status)) {
    return null;
  }

  return (
    <span className="inline-flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={updateStatus}
        disabled={isPending}
        className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition disabled:cursor-wait disabled:opacity-60 ${
          suspended
            ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
            : "bg-rose-50 text-rose-700 hover:bg-rose-100"
        }`}
      >
        {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : suspended ? <PlayCircle className="h-3.5 w-3.5" /> : <PauseCircle className="h-3.5 w-3.5" />}
        {isPending ? "Updating..." : suspended ? "Restore school" : "Suspend school"}
      </button>
      {error && <span className="max-w-52 text-right text-[11px] font-medium text-red-600">{error}</span>}
    </span>
  );
}
