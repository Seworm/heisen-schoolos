"use client";

import { useActionState, useState } from "react";

import {
  createAnnouncement,
  updateAnnouncement,
} from "./actions";

type TargetOption = {
  id: string;
  label: string;
};

type AnnouncementFormProps = {
  mode: "create" | "edit";
  announcementId?: string;
  initialTitle?: string;
  initialBody?: string;
  initialAudience?: string;
  initialTargetId?: string | null;
  initialExpiresAt?: string | null;
  classes: TargetOption[];
  streams: TargetOption[];
  students: TargetOption[];
  guardians: TargetOption[];
};

type ActionState = {
  error?: string;
} | null;

const AUDIENCE_OPTIONS = [
  {
    value: "school",
    label: "Whole school",
  },
  {
    value: "class",
    label: "Class",
  },
  {
    value: "stream",
    label: "Stream",
  },
  {
    value: "staff",
    label: "Staff",
  },
  {
    value: "parents",
    label: "Parents / guardians",
  },
  {
    value: "students",
    label: "All students",
  },
  {
    value: "individual",
    label: "Individual student",
  },
];

function formatDateTimeLocal(value?: string | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export default function AnnouncementForm({
  mode,
  announcementId,
  initialTitle = "",
  initialBody = "",
  initialAudience = "school",
  initialTargetId = null,
  initialExpiresAt = null,
  classes,
  streams,
  students,
  guardians,
}: AnnouncementFormProps) {
  const action =
    mode === "create"
      ? createAnnouncement
      : updateAnnouncement;

  const [state, formAction, isPending] = useActionState<
    ActionState,
    FormData
  >(action, null);

  const [audience, setAudience] = useState(initialAudience);
  const [targetId, setTargetId] = useState(
    initialTargetId ?? "",
  );

  const targetOptions =
    audience === "class"
      ? classes
      : audience === "stream"
        ? streams
        : audience === "parents"
          ? guardians
          : audience === "individual"
            ? students
            : [];

  const requiresTarget =
    audience === "class" ||
    audience === "stream" ||
    audience === "parents" ||
    audience === "individual";

  function handleAudienceChange(
    event: React.ChangeEvent<HTMLSelectElement>,
  ) {
    setAudience(event.target.value);
    setTargetId("");
  }

  return (
    <form
      action={formAction}
      className="space-y-6"
    >
      {mode === "edit" && announcementId ? (
        <input
          type="hidden"
          name="id"
          value={announcementId}
        />
      ) : null}

      {state?.error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      ) : null}

      <div className="space-y-2">
        <label
          htmlFor="title"
          className="block text-sm font-medium text-slate-800"
        >
          Title
        </label>

        <input
          id="title"
          name="title"
          type="text"
          maxLength={200}
          required
          defaultValue={initialTitle}
          placeholder="e.g. Mid-semester examination notice"
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
        />
      </div>

      <label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
        <input type="checkbox" name="sendSms" className="mt-0.5" />
        <span><span className="font-medium text-slate-800">Send SMS to announcement recipients</span><span className="mt-1 block text-xs text-slate-500">Available for a selected parent, class, or stream. Class and stream messages are sent to linked guardians with valid phone numbers.</span></span>
      </label>

      <div className="space-y-2">
        <label
          htmlFor="body"
          className="block text-sm font-medium text-slate-800"
        >
          Message
        </label>

        <textarea
          id="body"
          name="body"
          required
          rows={8}
          defaultValue={initialBody}
          placeholder="Write the announcement..."
          className="w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <label
            htmlFor="audience"
            className="block text-sm font-medium text-slate-800"
          >
            Audience
          </label>

          <select
            id="audience"
            name="audience"
            value={audience}
            onChange={handleAudienceChange}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
          >
            {AUDIENCE_OPTIONS.map((option) => (
              <option
                key={option.value}
                value={option.value}
              >
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="targetId"
            className="block text-sm font-medium text-slate-800"
          >
            Target
          </label>

          <select
            id="targetId"
            name="targetId"
            value={targetId}
            onChange={(event) =>
              setTargetId(event.target.value)
            }
            disabled={!requiresTarget}
            required={requiresTarget}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
          >
            <option value="">
              {requiresTarget
                ? "Select target..."
                : "Not required"}
            </option>

            {targetOptions.map((option) => (
              <option
                key={option.id}
                value={option.id}
              >
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <label
          htmlFor="expiresAt"
          className="block text-sm font-medium text-slate-800"
        >
          Expiry date and time
        </label>

        <input
          id="expiresAt"
          name="expiresAt"
          type="datetime-local"
          defaultValue={formatDateTimeLocal(
            initialExpiresAt,
          )}
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
        />

        <p className="text-xs text-slate-500">
          Leave empty if the announcement should not expire.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-100 pt-6">
        <a
          href={
            mode === "edit" && announcementId
              ? `/communications/${announcementId}`
              : "/communications"
          }
          className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          Cancel
        </a>

        <button
          type="submit"
          name="action"
          value="draft"
          disabled={isPending}
          className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? "Saving..." : "Save draft"}
        </button>

        {mode === "create" ? (
          <button
            type="submit"
            name="action"
            value="publish"
            disabled={isPending}
            className="inline-flex h-10 items-center justify-center rounded-lg bg-slate-950 px-5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending ? "Publishing..." : "Publish"}
          </button>
        ) : null}
      </div>
    </form>
  );
}