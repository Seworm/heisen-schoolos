import { and, desc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { attendanceRecords, attendanceSessions } from "@/db/schema";
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

export default async function GuardianAttendancePage({
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

  const attendance = await db
    .select({
      sessionId: attendanceSessions.id,
      createdAt: attendanceSessions.createdAt,
      status: attendanceRecords.status,
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
    .limit(12);

  const presentCount = attendance.filter((row) => row.status === "present").length;
  const rate = attendance.length > 0
    ? Math.round((presentCount / attendance.length) * 100)
    : 0;

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">Attendance</p>
          <h1 className="mt-1 text-2xl font-semibold text-slate-950">
            {selectedChild.firstName} {selectedChild.lastName}
          </h1>
        </div>
        <GuardianChildSelector
          childOptions={children}
          selectedChildId={selectedChild.id}
          currentPath="/guardian/attendance"
        />
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        <SummaryMetric label="Present" value={String(presentCount)} />
        <SummaryMetric label="Sessions" value={String(attendance.length)} />
        <SummaryMetric label="Rate" value={`${rate}%`} />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-950">Recent attendance</h2>
        {attendance.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">No attendance sessions have been recorded for this child yet.</p>
        ) : (
          <div className="mt-5 overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="text-slate-500">
                <tr>
                  <th className="pb-3 font-medium">Date</th>
                  <th className="pb-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {attendance.map((entry) => (
                  <tr key={entry.sessionId}>
                    <td className="py-3 text-slate-700">{formatDate(entry.createdAt)}</td>
                    <td className="py-3">
                      <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">{entry.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

function SummaryMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-950">{value}</p>
    </div>
  );
}

