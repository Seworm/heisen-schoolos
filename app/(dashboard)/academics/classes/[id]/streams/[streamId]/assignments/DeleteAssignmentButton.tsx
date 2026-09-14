"use client";

import { useActionState } from "react";

import { deleteStreamAssignment } from "./actions";

type Props = {
  classId: string;
  streamId: string;
  assignmentId: string;
};

type FormState = {
  error?: string;
};

const initialState: FormState = {};

export default function DeleteAssignmentButton({
  classId,
  streamId,
  assignmentId,
}: Props) {
  const [state, formAction, pending] = useActionState(
    deleteStreamAssignment,
    initialState,
  );

  function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    const confirmed = window.confirm(
      "Delete this teaching assignment? This action cannot be undone.",
    );

    if (!confirmed) {
      event.preventDefault();
    }
  }

  return (
    <form
      action={formAction}
      onSubmit={handleSubmit}
    >
      <input
        type="hidden"
        name="classId"
        value={classId}
      />

      <input
        type="hidden"
        name="streamId"
        value={streamId}
      />

      <input
        type="hidden"
        name="assignmentId"
        value={assignmentId}
      />

      {state.error ? (
        <p
          role="alert"
          className="mb-2 text-xs text-red-600"
        >
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? "Deleting..." : "Delete"}
      </button>
    </form>
  );
}