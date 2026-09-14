"use client";

import { useActionState } from "react";
import Link from "next/link";

import { transferPlacement } from "./actions";

type StreamOption = {
  id: string;
  className: string;
  streamName: string;
};

type TransferPlacementFormProps = {
  studentId: string;
  enrollmentId: string;
  currentStreamId: string;
  streams: StreamOption[];
  defaultDate: string;
};

type TransferState = {
  error?: string;
  success?: string;
};

const initialState: TransferState = {};

export default function TransferPlacementForm({
  studentId,
  enrollmentId,
  currentStreamId,
  streams,
  defaultDate,
}: TransferPlacementFormProps) {
  const [state, formAction, pending] = useActionState<
    TransferState,
    FormData
  >(
    transferPlacement,
    initialState,
  );

  return (
    <form
      action={formAction}
      className="space-y-6"
    >
      <input
        type="hidden"
        name="studentId"
        value={studentId}
      />

      <input
        type="hidden"
        name="enrollmentId"
        value={enrollmentId}
      />

      <div>
        <label
          htmlFor="destinationStreamId"
          className="mb-2 block text-sm font-medium text-slate-800"
        >
          Destination class / stream
        </label>

        <select
          id="destinationStreamId"
          name="destinationStreamId"
          required
          defaultValue=""
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
        >
          <option value="" disabled>
            Select destination
          </option>

          {streams.map((stream) => (
            <option
              key={stream.id}
              value={stream.id}
              disabled={stream.id === currentStreamId}
            >
              {stream.className} — {stream.streamName}
              {stream.id === currentStreamId
                ? " (Current)"
                : ""}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label
          htmlFor="transferDate"
          className="mb-2 block text-sm font-medium text-slate-800"
        >
          Transfer date
        </label>

        <input
          id="transferDate"
          name="transferDate"
          type="date"
          required
          defaultValue={defaultDate}
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
        />
      </div>

      {state.error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {state.error}
        </div>
      )}

      {state.success && (
        <div
          role="status"
          className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
        >
          {state.success}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Link
          href={`/students/${studentId}`}
          className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          Cancel
        </Link>

        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? "Transferring..." : "Confirm transfer"}
        </button>
      </div>
    </form>
  );
}