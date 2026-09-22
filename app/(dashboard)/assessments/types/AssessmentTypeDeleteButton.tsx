"use client";

import { useActionState } from "react";
import { deleteAssessmentType } from "./actions";

export default function AssessmentTypeDeleteButton({ id, name }: { id: string; name: string }) {
  const [state, formAction, pending] = useActionState(deleteAssessmentType, {});

  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        if (!window.confirm(`Delete assessment type "${name}"?`)) event.preventDefault();
      }}
      className="flex items-center gap-2"
    >
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        disabled={pending}
        className="text-sm font-semibold text-red-600 transition hover:text-red-800 disabled:opacity-50"
      >
        {pending ? "Deleting..." : "Delete"}
      </button>
      {state.error ? <span className="text-xs text-red-600">{state.error}</span> : null}
      {state.success ? <span className="text-xs text-emerald-700">{state.success}</span> : null}
    </form>
  );
}
