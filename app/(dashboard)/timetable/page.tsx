import { asc, and, eq } from "drizzle-orm";
import { CalendarDays, CheckCircle2, Clock3, Download, Sparkles, Users } from "lucide-react";
import { db } from "@/db";
import {
  academicYears,
  classLevels,
  classrooms,
  staff,
  streams,
  subjects,
  terms,
  timetableEntries,
  timetablePeriods,
} from "@/db/schema";
import { getCurrentSchool } from "@/lib/current-school";
import { createTimetablePeriod, deleteTimetablePeriod, generateIntelligentTimetable } from "./actions";
import PrintTimetableButton from "./PrintTimetableButton";

export const dynamic = "force-dynamic";

export default async function TimetablePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const school = await getCurrentSchool();
  const params = await searchParams;
  const years = await db
    .select({ id: academicYears.id, name: academicYears.name, isCurrent: academicYears.isCurrent })
    .from(academicYears)
    .where(eq(academicYears.schoolId, school.id))
    .orderBy(asc(academicYears.startDate));
  const currentYear = years.find((year) => year.isCurrent) ?? years[years.length - 1];
  const selectedYearId = typeof params.year === "string" ? params.year : currentYear?.id;
  const termsForYear = selectedYearId
    ? await db.select({ id: terms.id, name: terms.name, termNumber: terms.termNumber, isCurrent: terms.isCurrent })
        .from(terms)
        .where(eq(terms.academicYearId, selectedYearId))
        .orderBy(asc(terms.termNumber))
    : [];
  const currentTerm = termsForYear.find((term) => term.isCurrent) ?? termsForYear[0];
  const selectedTermId = typeof params.term === "string" ? params.term : currentTerm?.id;
  const selectedStreamId = typeof params.classId === "string" ? params.classId : "";
  const selectedStaffId = typeof params.teacherId === "string" ? params.teacherId : "";
  const streamsForSchool = await db.select({ id: streams.id, name: streams.name }).from(streams).innerJoin(classLevels, eq(classLevels.id, streams.classLevelId)).where(eq(classLevels.schoolId, school.id)).orderBy(asc(streams.name));
  const staffForSchool = await db.select({ id: staff.id, firstName: staff.firstName, lastName: staff.lastName }).from(staff).where(eq(staff.schoolId, school.id)).orderBy(asc(staff.lastName), asc(staff.firstName));
  const entries = await db
    .select({
      id: timetableEntries.id,
      period: timetablePeriods.name,
      day: timetablePeriods.dayOfWeek,
      startsAt: timetablePeriods.startsAt,
      endsAt: timetablePeriods.endsAt,
      classroom: classrooms.name,
      subject: subjects.name,
      stream: streams.name,
      teacher: staff.firstName,
      teacherLast: staff.lastName,
    })
    .from(timetableEntries)
    .innerJoin(timetablePeriods, eq(timetablePeriods.id, timetableEntries.periodId))
    .innerJoin(subjects, eq(subjects.id, timetableEntries.subjectId))
    .innerJoin(streams, eq(streams.id, timetableEntries.streamId))
    .innerJoin(classLevels, eq(classLevels.id, streams.classLevelId))
    .innerJoin(staff, eq(staff.id, timetableEntries.staffId))
    .leftJoin(classrooms, eq(classrooms.id, timetableEntries.classroomId))
    .where(and(eq(timetableEntries.schoolId, school.id), eq(classLevels.schoolId, school.id), eq(subjects.schoolId, school.id), eq(staff.schoolId, school.id), ...(selectedYearId ? [eq(timetableEntries.academicYearId, selectedYearId)] : []), ...(selectedTermId ? [eq(timetableEntries.termId, selectedTermId)] : []), ...(selectedStreamId ? [eq(timetableEntries.streamId, selectedStreamId)] : []), ...(selectedStaffId ? [eq(timetableEntries.staffId, selectedStaffId)] : [])))
    .orderBy(asc(timetablePeriods.dayOfWeek), asc(timetablePeriods.sortOrder));
  const periods = await db
    .select({
      id: timetablePeriods.id,
      name: timetablePeriods.name,
      dayOfWeek: timetablePeriods.dayOfWeek,
      startsAt: timetablePeriods.startsAt,
      endsAt: timetablePeriods.endsAt,
    })
    .from(timetablePeriods)
    .where(eq(timetablePeriods.schoolId, school.id))
    .orderBy(asc(timetablePeriods.dayOfWeek), asc(timetablePeriods.sortOrder));

  const scheduled = typeof params.scheduled === "string" ? params.scheduled : null;
  const unscheduled = typeof params.unscheduled === "string" ? params.unscheduled : null;
  const days = ["", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  return (
    <main className="mx-auto max-w-7xl space-y-7 px-4 py-7 sm:px-6 lg:px-8">
      <section className="relative overflow-hidden rounded-3xl border border-[#dfe8e2] bg-[#f3faf5] px-6 py-8 text-slate-900 shadow-sm sm:px-8">
        <div className="absolute -right-16 -top-24 h-64 w-64 rounded-full bg-[#dff5e3] blur-3xl" />
        <div className="relative">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#cfe4d5] bg-[#edf7f0] px-3 py-1.5 text-xs font-semibold text-[#005530]"><Sparkles className="h-3.5 w-3.5" /> Intelligent scheduling</div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Build a clash-free timetable.</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">The scheduler prioritises constrained teachers and classes, distributes lessons across available periods, and refuses teacher, class and room collisions.</p>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Timetable setup</p>
        <h2 className="mt-2 text-xl font-bold tracking-tight">Configure teaching periods</h2>
        <p className="mt-1 text-sm text-slate-500">Periods must be configured before the intelligent scheduler can place lessons.</p>
        <form action={createTimetablePeriod} className="mt-5 grid gap-3 sm:grid-cols-6">
          <input name="name" required placeholder="Period 1" className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm" />
          <select name="dayOfWeek" defaultValue="1" className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm">{days.slice(1).map((day, index) => <option key={day} value={index + 1}>{day}</option>)}</select>
          <input name="startsAt" required type="time" className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm" />
          <input name="endsAt" required type="time" className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm" />
          <input name="sortOrder" required type="number" min="1" placeholder="Order" className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm" />
          <button className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700">Add period</button>
        </form>
        <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {periods.map((period) => (
            <div key={period.id} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5 text-sm">
              <span><strong>{days[period.dayOfWeek]}</strong> · {period.name}<span className="ml-2 text-xs text-slate-500">{period.startsAt}–{period.endsAt}</span></span>
              <form action={deleteTimetablePeriod}><input type="hidden" name="periodId" value={period.id} /><button className="text-xs font-semibold text-rose-600">Remove</button></form>
            </div>
          ))}
          {periods.length === 0 && <p className="text-sm text-slate-500">No periods configured yet.</p>}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div><p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Generate schedule</p><h2 className="mt-2 text-xl font-bold tracking-tight">Create a smart weekly plan</h2><p className="mt-1 text-sm text-slate-500">Existing entries are preserved. Only open slots are used.</p></div>
          <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700"><CheckCircle2 className="h-4 w-4" /> Constraint protection enabled</div>
        </div>
        <form action={generateIntelligentTimetable} className="mt-5 grid gap-3 sm:grid-cols-4">
          <select name="academicYearId" defaultValue={selectedYearId} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm">
            {years.map((year) => <option key={year.id} value={year.id}>{year.name}</option>)}
          </select>
          <select name="termId" defaultValue={selectedTermId} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm">
            {termsForYear.map((term) => <option key={term.id} value={term.id}>{term.name}</option>)}
          </select>
          <select name="lessonsPerAssignment" defaultValue="1" className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm">
            {[1, 2, 3, 4, 5].map((count) => <option key={count} value={count}>{count} lesson{count === 1 ? "" : "s"} per subject</option>)}
          </select>
          <button className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-900/10 transition hover:bg-emerald-700"><Sparkles className="h-4 w-4" /> Generate timetable</button>
        </form>
        {(scheduled || unscheduled) && <p className="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">Generated <strong>{scheduled ?? 0}</strong> lessons. <strong>{unscheduled ?? 0}</strong> lessons could not be placed because of capacity or conflicts.</p>}
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-5"><div><h2 className="font-bold">Weekly timetable</h2><p className="mt-1 text-xs text-slate-500">Teacher and class assignments for the selected academic period.</p></div><div className="flex flex-wrap items-center gap-2"><a href={`/api/timetable/export?year=${encodeURIComponent(selectedYearId ?? "")}&term=${encodeURIComponent(selectedTermId ?? "")}&classId=${encodeURIComponent(selectedStreamId)}&teacherId=${encodeURIComponent(selectedStaffId)}`} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"><Download className="h-3.5 w-3.5" /> CSV</a><PrintTimetableButton /><span className="ml-1 inline-flex items-center gap-1.5 text-xs text-slate-500"><Clock3 className="h-3.5 w-3.5" /> {entries.length} lessons</span><span className="inline-flex items-center gap-1.5 text-xs text-slate-500"><Users className="h-3.5 w-3.5" /> {new Set(entries.map((entry) => `${entry.teacher} ${entry.teacherLast}`)).size} teachers</span></div></div>
        <form className="flex flex-wrap gap-3 border-b border-slate-100 bg-slate-50 px-5 py-3" method="get"><input type="hidden" name="year" value={selectedYearId ?? ""} /><input type="hidden" name="term" value={selectedTermId ?? ""} /><select name="classId" defaultValue={selectedStreamId} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"><option value="">All classes</option>{streamsForSchool.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><select name="teacherId" defaultValue={selectedStaffId} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"><option value="">All teachers</option>{staffForSchool.map((item) => <option key={item.id} value={item.id}>{item.firstName} {item.lastName}</option>)}</select><button className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white">Apply view</button>{(selectedStreamId || selectedStaffId) && <a href={`/timetable?year=${encodeURIComponent(selectedYearId ?? "")}&term=${encodeURIComponent(selectedTermId ?? "")}`} className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-600">Clear</a>}</form>
        <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left text-sm"><thead className="bg-slate-50 text-[11px] uppercase tracking-[0.14em] text-slate-500"><tr><th className="px-5 py-3">Day</th><th className="px-5 py-3">Period</th><th className="px-5 py-3">Class</th><th className="px-5 py-3">Subject</th><th className="px-5 py-3">Teacher</th><th className="px-5 py-3">Room</th></tr></thead><tbody className="divide-y divide-slate-100">{entries.map((entry) => <tr key={entry.id} className="transition hover:bg-emerald-50/30"><td className="px-5 py-4 font-semibold text-slate-700">{days[entry.day] ?? entry.day}</td><td className="px-5 py-4 text-slate-500">{entry.period}<span className="ml-1 text-xs text-slate-400">{entry.startsAt}–{entry.endsAt}</span></td><td className="px-5 py-4">{entry.stream}</td><td className="px-5 py-4 font-semibold text-slate-900">{entry.subject}</td><td className="px-5 py-4 text-slate-600">{entry.teacher} {entry.teacherLast}</td><td className="px-5 py-4 text-slate-500">{entry.classroom || "—"}</td></tr>)}{entries.length === 0 && <tr><td colSpan={6} className="px-5 py-16 text-center"><CalendarDays className="mx-auto h-8 w-8 text-slate-300" /><p className="mt-3 font-semibold text-slate-700">No lessons scheduled yet</p><p className="mt-1 text-sm text-slate-500">Assign teachers and generate a timetable to get started.</p></td></tr>}</tbody></table></div>
      </section>
    </main>
  );
}
