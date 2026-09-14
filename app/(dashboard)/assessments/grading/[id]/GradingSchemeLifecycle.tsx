"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import {
  activateGradingScheme,
  archiveGradingScheme,
} from "./lifecycle-actions";

type Props = {
  schemeId: string;
  status: string;
};

export default function GradingSchemeLifecycle({
  schemeId,
  status,
}: Props) {
  const router = useRouter();

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState<string | null>(
      null,
    );

  async function activate() {
    setError(null);
    setLoading(true);

    const result =
      await activateGradingScheme(
        schemeId,
      );

    setLoading(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    router.refresh();
  }

  async function archive() {
    const confirmed =
      window.confirm(
        "Archive this grading scheme? It will no longer be available as the active grading configuration.",
      );

    if (!confirmed) {
      return;
    }

    setError(null);
    setLoading(true);

    const result =
      await archiveGradingScheme(
        schemeId,
      );

    setLoading(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    router.refresh();
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex flex-wrap gap-2">
        {status === "draft" && (
          <button
            type="button"
            onClick={activate}
            disabled={loading}
            className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {loading
              ? "Processing..."
              : "Activate scheme"}
          </button>
        )}

        {status === "active" && (
          <button
            type="button"
            onClick={archive}
            disabled={loading}
            className="rounded-xl border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
          >
            Archive
          </button>
        )}
      </div>

      {error && (
        <p className="max-w-xs text-right text-xs font-medium text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}