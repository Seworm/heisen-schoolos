import Link from "next/link";
import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import { announcements } from "@/db/schema";
import { requireCurrentSchool } from "@/lib/current-school";

import AnnouncementActions from "./AnnouncementActions";

export const dynamic = "force-dynamic";

const audienceLabels: Record<string, string> = {
  school: "Whole school",
  class: "Class",
  stream: "Stream",
  staff: "Staff",
  parents: "Parents / guardians",
  students: "All students",
  individual: "Individual student",
};

export default async function AnnouncementDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const school = await requireCurrentSchool();

  const [announcement] = await db
    .select()
    .from(announcements)
    .where(
      and(
        eq(announcements.id, id),
        eq(announcements.schoolId, school.id),
      ),
    )
    .limit(1);

  if (!announcement) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-12 text-center">
        <h1 className="text-2xl font-semibold text-slate-950">
          Announcement not found
        </h1>

        <Link
          href="/communications"
          className="mt-4 inline-block text-sm font-medium text-slate-600 underline"
        >
          Back to announcements
        </Link>
      </main>
    );
  }

  const expired =
    announcement.publishedAt &&
    announcement.expiresAt &&
    announcement.expiresAt <= new Date();

  const status = !announcement.publishedAt
    ? "Draft"
    : expired
      ? "Expired"
      : "Published";

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <Link
          href="/communications"
          className="text-sm font-medium text-slate-500 hover:text-slate-900"
        >
          ← Announcements
        </Link>
      </div>

      <article className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-6 sm:p-8">
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
              {audienceLabels[announcement.audience] ??
                announcement.audience}
            </span>

            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
              {status}
            </span>
          </div>

          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">
            {announcement.title}
          </h1>

          <p className="mt-3 text-sm text-slate-500">
            Created {new Date(announcement.createdAt).toLocaleString()}
          </p>
        </div>

        <div className="p-6 sm:p-8">
          <div className="whitespace-pre-wrap text-sm leading-7 text-slate-700">
            {announcement.body}
          </div>

          <div className="mt-8 border-t border-slate-200 pt-6 text-sm text-slate-500">
            {announcement.publishedAt && (
              <p>
                Published{" "}
                {new Date(announcement.publishedAt).toLocaleString()}
              </p>
            )}

            {announcement.expiresAt && (
              <p className="mt-1">
                Expires{" "}
                {new Date(announcement.expiresAt).toLocaleString()}
              </p>
            )}
          </div>
        </div>
      </article>

      <AnnouncementActions
        id={announcement.id}
        published={Boolean(announcement.publishedAt)}
      />
    </main>
  );
}