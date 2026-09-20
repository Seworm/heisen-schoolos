import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { timetableEntries, timetablePeriods, subjects, streams, staff } from "@/db/schema";
import { getCurrentSchool } from "@/lib/current-school";

export const dynamic = "force-dynamic";
export default async function TimetablePage() {
  const school = await getCurrentSchool();
  const entries = await db.select({ id: timetableEntries.id, period: timetablePeriods.name, day: timetablePeriods.dayOfWeek, startsAt: timetablePeriods.startsAt, subject: subjects.name, stream: streams.name, teacher: staff.firstName, teacherLast: staff.lastName }).from(timetableEntries).innerJoin(timetablePeriods, eq(timetablePeriods.id, timetableEntries.periodId)).innerJoin(subjects, eq(subjects.id, timetableEntries.subjectId)).innerJoin(streams, eq(streams.id, timetableEntries.streamId)).innerJoin(staff, eq(staff.id, timetableEntries.staffId)).where(eq(timetableEntries.schoolId, school.id)).orderBy(asc(timetablePeriods.dayOfWeek), asc(timetablePeriods.sortOrder)).limit(200);
  return <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8"><p className="text-sm text-slate-500">Academics</p><h1 className="text-3xl font-semibold tracking-tight">Timetable</h1><p className="mt-1 text-sm text-slate-500">Teacher, class and room scheduling with database-level conflict protection.</p><div className="mt-7 overflow-hidden rounded-xl border border-slate-200 bg-white"><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3">Day</th><th className="px-5 py-3">Period</th><th className="px-5 py-3">Class</th><th className="px-5 py-3">Subject</th><th className="px-5 py-3">Teacher</th></tr></thead><tbody className="divide-y divide-slate-100">{entries.map((e) => <tr key={e.id}><td className="px-5 py-3">{["", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"][e.day] ?? e.day}</td><td className="px-5 py-3">{e.period} <span className="text-slate-400">({e.startsAt})</span></td><td className="px-5 py-3">{e.stream}</td><td className="px-5 py-3 font-medium">{e.subject}</td><td className="px-5 py-3">{e.teacher} {e.teacherLast}</td></tr>)}{entries.length === 0 && <tr><td colSpan={5} className="px-5 py-12 text-center text-slate-500">No timetable entries have been configured.</td></tr>}</tbody></table></div></div></main>;
}


