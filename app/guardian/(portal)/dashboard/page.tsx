import { and, desc, eq, inArray } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import {
  announcements,
  attendanceRecords,
  attendanceSessions,
  resultPublicationStudents,
  resultPublications,
} from "@/db/schema";
import { requireCurrentGuardian } from "@/lib/guardian-auth";
import { GuardianChildSelector } from "../GuardianChildSelector";

function formatDate(value: string | Date | null) {
  if (!value) return "Not available";

  return new Intl.DateTimeFormat("en-GH", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export default async function GuardianDashboardPage({
  searchParams,
}: {
  searchParams?: Promise<{ child?: string }>;
}) {
  const params = await searchParams;
  const { children, schoolId } = await requireCurrentGuardian();

  if (children.length === 0) {
    redirect("/guardian/login");
  }

  const selectedChild =
    children.find((child) => child.id === params?.child) ?? children[0];

  const attendanceRows = await db
    .select({
      status: attendanceRecords.status,
      createdAt: attendanceSessions.createdAt,
    })
    .from(attendanceRecords)
    .innerJoin(
      attendanceSessions,
      eq(attendanceRecords.attendanceSessionId, attendanceSessions.id),
    )
    .where(
      and(
        eq(attendanceRecords.studentId, selectedChild.id),
        eq(attendanceSessions.schoolId, schoolId),
      ),
    )
    .orderBy(desc(attendanceSessions.createdAt))
    .limit(8);

  const publishedResults = await db
    .select({
      id: resultPublications.id,
      publishedAt: resultPublications.publishedAt,
      overallPercentage: resultPublicationStudents.overallPercentage,
    })
    .from(resultPublicationStudents)
    .innerJoin(
      resultPublications,
      eq(resultPublicationStudents.publicationId, resultPublications.id),
    )
    .where(
      and(
        eq(resultPublicationStudents.studentId, selectedChild.id),
        eq(resultPublications.schoolId, schoolId),
        eq(resultPublications.status, "published"),
      ),
    )
    .orderBy(desc(resultPublications.publishedAt))
    .limit(4);

  const recentAnnouncements = await db
    .select({
      id: announcements.id,
      title: announcements.title,
      body: announcements.body,
      publishedAt: announcements.publishedAt,
    })
    .from(announcements)
    .where(
      and(
        eq(announcements.schoolId, schoolId),
        inArray(announcements.audience, ["school", "parents"]),
      ),
    )
    .orderBy(desc(announcements.publishedAt))
    .limit(4);

  const presentCount = attendanceRows.filter((row) => row.status === "present").length;
  const attendanceRate = attendanceRows.length > 0
    ? Math.round((presentCount / attendanceRows.length) * 100)
    : 0;

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">Child overview</p>
          <h1 className="mt-1 text-2xl font-semibold text-slate-950">
            {selectedChild.firstName} {selectedChild.lastName}
          </h1>
        </div>

        <GuardianChildSelector
          childOptions={children}
          selectedChildId={selectedChild.id}
          currentPath="/guardian/dashboard"
        />
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard title="Current status" value="Active" detail={`Student #: ${selectedChild.studentNumber}`} />
        <SummaryCard title="Attendance" value={`${attendanceRate}%`} detail="School term summary" />
        <SummaryCard title="Published results" value={`${publishedResults.length}`} detail="Latest reports" />
        <SummaryCard title="Announcements" value={`${recentAnnouncements.length}`} detail="Latest updates" />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-950">Recent announcements</h2>
          <div className="mt-4 space-y-4">
            {recentAnnouncements.length === 0 ? (
              <p className="text-sm text-slate-500">No school announcements are available for this child yet.</p>
            ) : (
              recentAnnouncements.map((announcement) => (
                <div key={announcement.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <p className="font-semibold text-slate-900">{announcement.title}</p>
                    <span className="text-xs text-slate-500">{formatDate(announcement.publishedAt)}</span>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">{announcement.body}</p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-950">Latest results</h2>
          <div className="mt-4 space-y-4">
            {publishedResults.length === 0 ? (
              <p className="text-sm text-slate-500">No published results are available yet.</p>
            ) : (
              publishedResults.map((result) => (
                <div key={result.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">{formatDate(result.publishedAt)}</p>
                  <p className="mt-1 font-semibold text-slate-900">{result.overallPercentage}% overall</p>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

function SummaryCard({ title, value, detail }: { title: string; value: string; detail: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-950">{value}</p>
      <p className="mt-2 text-sm text-slate-500">{detail}</p>
    </div>
  );
}

