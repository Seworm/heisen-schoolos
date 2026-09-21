"use client";

import { useState, useTransition } from "react";
import { ArrowUpRight, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { switchActiveSchool } from "@/lib/school-workspace";

export default function SchoolWorkspaceButton({
  schoolId,
}: {
  schoolId: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function openWorkspace() {
    setError(null);
    startTransition(async () => {
      try {
        await switchActiveSchool(schoolId);
        router.push("/dashboard");
        router.refresh();
      } catch (actionError) {
        setError(
          actionError instanceof Error
            ? actionError.message
            : "Unable to open this school workspace.",
        );
      }
    });
  }

  return (
    <span className="inline-flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={openWorkspace}
        disabled={isPending}
        className="inline-flex items-center gap-1.5 font-semibold text-blue-600 transition hover:text-blue-800 disabled:cursor-wait disabled:opacity-60"
      >
        {isPending ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <ArrowUpRight className="h-3.5 w-3.5" />
        )}
        {isPending ? "Opening..." : "Open workspace"}
      </button>
      {error && (
        <span className="max-w-48 text-right text-[11px] font-medium text-red-600">
          {error}
        </span>
      )}
    </span>
  );
}
