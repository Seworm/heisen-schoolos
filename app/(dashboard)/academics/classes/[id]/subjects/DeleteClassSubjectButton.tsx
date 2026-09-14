"use client";

import { useActionState } from "react";

import { removeClassSubject } from "./actions";

type Props = {
  classId: string;
  classSubjectId: string;
  subjectName: string;
};

type FormState = {
  error?: string;
};

const initialState: FormState = {};

export default function DeleteClassSubjectButton({
  classId,
  classSubjectId,
  subjectName,
}: Props) {
  const [state, formAction, pending] = useActionState(
    removeClassSubject,
    initialState,
  );

  function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    const confirmed = window.confirm(
      `Remove ${subjectName} from this class curriculum?`,
    );

    if (!confirmed) {
      event.preventDefault();
    }
  }

  return (
    <form
      action={formAction}
      onSubmit={handleSubmit}
      className="flex flex-col items-end"
    >
      <input
        type="hidden"
        name="classId"
        value={classId}
      />

      <input
        type="hidden"
        name="classSubjectId"
        value={classSubjectId}
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
        {pending ? "Removing..." : "Remove"}
      </button>
    </form>
  );
}