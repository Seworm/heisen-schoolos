"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import {
  deleteAnnouncement,
  publishAnnouncement,
  unpublishAnnouncement,
  retryAnnouncementSms,
} from "../actions";

type AnnouncementActionsProps = {
  id: string;
  published: boolean;
  smsFailed: boolean;
};

export default function AnnouncementActions({
  id,
  published,
  smsFailed,
}: AnnouncementActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function run(action: () => Promise<void>) {
    startTransition(async () => {
      try {
        await action();
        router.refresh();
      } catch (error) {
        if (error instanceof Error) {
          window.alert(error.message);
        } else {
          window.alert("Something went wrong.");
        }
      }
    });
  }

  function handleDelete() {
    const confirmed = window.confirm(
      "Delete this announcement? This action cannot be undone.",
    );

    if (!confirmed) {
      return;
    }

    run(() => deleteAnnouncement(id));
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <a
        href={`/communications/${id}/edit`}
        className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
      >
        Edit
      </a>

      {published ? (
        <button
          type="button"
          disabled={isPending}
          onClick={() => run(() => unpublishAnnouncement(id))}
          className="inline-flex h-10 items-center justify-center rounded-lg border border-amber-200 bg-amber-50 px-4 text-sm font-medium text-amber-700 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? "Working..." : "Unpublish"}
        </button>
      ) : (
        <button
          type="button"
          disabled={isPending}
          onClick={() => run(() => publishAnnouncement(id))}
          className="inline-flex h-10 items-center justify-center rounded-lg bg-slate-950 px-4 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? "Publishing..." : "Publish"}
        </button>
      )}

      {published && smsFailed && (
        <button
          type="button"
          disabled={isPending}
          onClick={() => run(() => retryAnnouncementSms(id))}
          className="inline-flex h-10 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 px-4 text-sm font-medium text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? "Retrying..." : "Retry SMS"}
        </button>
      )}

      <button
        type="button"
        disabled={isPending}
        onClick={handleDelete}
        className="inline-flex h-10 items-center justify-center rounded-lg border border-red-200 bg-white px-4 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Delete
      </button>
    </div>
  );
}
