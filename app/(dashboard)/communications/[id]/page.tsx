import Link from "next/link";
import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import { announcementSmsDeliveries, announcements } from "@/db/schema";
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

  const smsDeliveries = await db
    .select()
    .from(announcementSmsDeliveries)
    .where(
      and(
        eq(announcementSmsDeliveries.announcementId, announcement.id),
        eq(announcementSmsDeliveries.schoolId, school.id),
      ),
    )
    .orderBy(announcementSmsDeliveries.attemptedAt);

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

          {smsDeliveries.length > 0 && (
            <div className="mt-8 border-t border-slate-200 pt-6">
              <h2 className="text-sm font-semibold text-slate-900">SMS delivery history</h2>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
                  <p className="text-xs text-slate-500">Attempts</p>
                  <p className="mt-1 text-lg font-semibold text-slate-900">{smsDeliveries.length}</p>
                </div>
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
                  <p className="text-xs text-emerald-700">Sent</p>
                  <p className="mt-1 text-lg font-semibold text-emerald-800">{smsDeliveries.filter((delivery) => delivery.status === "sent").length}</p>
                </div>
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2">
                  <p className="text-xs text-red-700">Failed</p>
                  <p className="mt-1 text-lg font-semibold text-red-800">{smsDeliveries.filter((delivery) => delivery.status === "failed").length}</p>
                </div>
              </div>
              <div className="mt-3 space-y-2">
                {smsDeliveries.map((delivery) => (
                  <div key={delivery.id} className="flex flex-wrap justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs">
                    <span>{delivery.status === "sent" ? "Delivered to" : "Failed for"} {delivery.recipient}</span>
                    <span>{new Date(delivery.attemptedAt).toLocaleString()}</span>
                    {delivery.errorMessage && <span className="basis-full text-red-600">{delivery.errorMessage}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </article>

      <AnnouncementActions
        id={announcement.id}
        published={Boolean(announcement.publishedAt)}
        smsFailed={smsDeliveries.some((delivery) => delivery.status === "failed")}
      />
    </main>
  );
}