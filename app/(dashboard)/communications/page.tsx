import Link from "next/link";
import { desc, eq, inArray } from "drizzle-orm";

import { db } from "@/db";
import { announcementSmsDeliveries, announcements } from "@/db/schema";
import { requireCurrentSchool } from "@/lib/current-school";

export const dynamic = "force-dynamic";

const audienceLabels: Record<string, string> = {
  school: "Whole school",
  class: "Class",
  stream: "Stream",
  staff: "Staff",
  parents: "Parents",
  students: "Students",
  individual: "Individual",
};

function getStatus(
  publishedAt: Date | null,
  expiresAt: Date | null,
) {
  if (!publishedAt) {
    return {
      label: "Draft",
      className: "bg-slate-100 text-slate-700",
    };
  }

  if (expiresAt && expiresAt <= new Date()) {
    return {
      label: "Expired",
      className: "bg-amber-100 text-amber-800",
    };
  }

  return {
    label: "Published",
    className: "bg-emerald-100 text-emerald-800",
  };
}

export default async function CommunicationsPage() {
  const school = await requireCurrentSchool();

  const rows = await db
    .select()
    .from(announcements)
    .where(eq(announcements.schoolId, school.id))
    .orderBy(desc(announcements.createdAt))
    .limit(100);
  const deliveryRows = rows.length
    ? await db
        .select({
          announcementId: announcementSmsDeliveries.announcementId,
          status: announcementSmsDeliveries.status,
        })
        .from(announcementSmsDeliveries)
        .where(
          inArray(
            announcementSmsDeliveries.announcementId,
            rows.map((row) => row.id),
          ),
        )
    : [];
  const deliverySummary = new Map<
    string,
    { sent: number; failed: number }
  >();
  for (const delivery of deliveryRows) {
    const summary = deliverySummary.get(delivery.announcementId) ?? {
      sent: 0,
      failed: 0,
    };
    if (delivery.status === "sent") {
      summary.sent += 1;
    } else if (delivery.status === "failed") {
      summary.failed += 1;
    }
    deliverySummary.set(delivery.announcementId, summary);
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">
            School communications
          </p>

          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">
            Announcements
          </h1>

          <p className="mt-2 max-w-2xl text-sm text-slate-500">
            Publish targeted notices to students, parents, staff,
            classes, streams or the whole school.
          </p>
        </div>

        <Link
          href="/communications/new"
          className="inline-flex items-center justify-center rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
        >
          New announcement
        </Link>
      </div>

      <div className="mt-8 space-y-4">
        {rows.map((row) => {
          const status = getStatus(row.publishedAt, row.expiresAt);
          const sms = deliverySummary.get(row.id);

          return (
            <Link
              key={row.id}
              href={`/communications/${row.id}`}
              className="block rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300 hover:shadow"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="font-semibold text-slate-950">
                    {row.title}
                  </h2>

                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                      {audienceLabels[row.audience] ?? row.audience}
                    </span>

                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${status.className}`}
                    >
                      {status.label}
                    </span>
                    {sms && (
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                          sms.failed > 0
                            ? "bg-red-100 text-red-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        SMS: {sms.sent} sent
                        {sms.failed > 0 ? ` · ${sms.failed} failed` : ""}
                      </span>
                    )}
                  </div>
                </div>

                <span className="text-xs text-slate-400">
                  {new Date(row.createdAt).toLocaleString()}
                </span>
              </div>

              <p className="mt-4 line-clamp-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                {row.body}
              </p>

              {row.expiresAt && (
                <p className="mt-4 text-xs text-slate-400">
                  Expires {new Date(row.expiresAt).toLocaleString()}
                </p>
              )}
            </Link>
          );
        })}

        {rows.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <h2 className="font-semibold text-slate-950">
              No announcements yet
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Create your first school communication.
            </p>

            <Link
              href="/communications/new"
              className="mt-5 inline-flex rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Create announcement
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}