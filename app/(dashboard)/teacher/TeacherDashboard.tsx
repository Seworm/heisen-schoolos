import Link from "next/link";
import { and, asc, desc, eq, gt, isNotNull, isNull, or } from "drizzle-orm";
import {
  Bell,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Users,
} from "lucide-react";

import { db } from "@/db";
import {
  academicYears,
  announcements,
  assessments,
  assessmentTypes,
  classLevels,
  streams,
  subjects,
  teacherAssignments,
  terms,
  timetableEntries,
  timetablePeriods,
  staff,
} from "@/db/schema";
import type { ApplicationUser } from "@/lib/auth/compat";

type Props = {
  schoolId: string;
  user: ApplicationUser;
};

export default async function TeacherDashboard({ schoolId, user }: Props) {
  const [teacher] = await db
    .select({ id: staff.id, firstName: staff.firstName, lastName: staff.lastName })
    .from(staff)
    .where(and(eq(staff.schoolId, schoolId), eq(staff.email, user.email)))
    .limit(1);

  const [year] = await db
    .select({ id: academicYears.id, name: academicYears.name })
    .from(academicYears)
    .where(and(eq(academicYears.schoolId, schoolId), eq(academicYears.isCurrent, true)))
    .limit(1);

  const [term] = year
    ? await db
        .select({ id: terms.id, name: terms.name })
        .from(terms)
        .where(and(eq(terms.academicYearId, year.id), eq(terms.isCurrent, true)))
        .limit(1)
    : [];

  const assignments = teacher
    ? await db
        .select({
          id: teacherAssignments.id,
          streamId: streams.id,
          streamName: streams.name,
          className: classLevels.name,
          subjectName: subjects.name,
          isClassTeacher: teacherAssignments.isClassTeacher,
        })
        .from(teacherAssignments)
        .innerJoin(streams, eq(streams.id, teacherAssignments.streamId))
        .innerJoin(classLevels, eq(classLevels.id, streams.classLevelId))
        .leftJoin(subjects, eq(subjects.id, teacherAssignments.subjectId))
        .where(
          and(
            eq(teacherAssignments.staffId, teacher.id),
            eq(classLevels.schoolId, schoolId),
            ...(year ? [eq(teacherAssignments.academicYearId, year.id)] : []),
          ),
        )
        .orderBy(asc(classLevels.name), asc(streams.name), asc(subjects.name))
    : [];

  const timetable = teacher
    ? await db
        .select({
          id: timetableEntries.id,
          day: timetablePeriods.dayOfWeek,
          period: timetablePeriods.name,
          startsAt: timetablePeriods.startsAt,
          endsAt: timetablePeriods.endsAt,
          stream: streams.name,
          subject: subjects.name,
        })
        .from(timetableEntries)
        .innerJoin(timetablePeriods, eq(timetablePeriods.id, timetableEntries.periodId))
        .innerJoin(streams, eq(streams.id, timetableEntries.streamId))
        .innerJoin(subjects, eq(subjects.id, timetableEntries.subjectId))
        .where(
          and(
            eq(timetableEntries.schoolId, schoolId),
            eq(timetableEntries.staffId, teacher.id),
            ...(year ? [eq(timetableEntries.academicYearId, year.id)] : []),
            ...(term ? [eq(timetableEntries.termId, term.id)] : []),
          ),
        )
        .orderBy(asc(timetablePeriods.dayOfWeek), asc(timetablePeriods.sortOrder))
        .limit(20)
    : [];

  const noticeVisibility = and(
    isNotNull(announcements.publishedAt),
    or(isNull(announcements.expiresAt), gt(announcements.expiresAt, new Date())),
  );
  const notices = await db
    .select({ id: announcements.id, title: announcements.title, body: announcements.body, createdAt: announcements.createdAt })
    .from(announcements)
    .where(and(eq(announcements.schoolId, schoolId), eq(announcements.audience, "staff"), noticeVisibility))
    .orderBy(desc(announcements.createdAt))
    .limit(5);

  const schoolNotices = await db
    .select({ id: announcements.id, title: announcements.title, body: announcements.body, createdAt: announcements.createdAt })
    .from(announcements)
    .where(and(eq(announcements.schoolId, schoolId), eq(announcements.audience, "school"), noticeVisibility))
    .orderBy(desc(announcements.createdAt))
    .limit(5);
  const allNotices = [...notices, ...schoolNotices]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 5);

  const assessmentRows = teacher && year && term
    ? await db
        .select({
          id: assessments.id,
          name: assessments.name,
          status: assessments.status,
          streamName: streams.name,
          subjectName: subjects.name,
          typeName: assessmentTypes.name,
        })
        .from(assessments)
        .innerJoin(streams, eq(streams.id, assessments.streamId))
        .innerJoin(subjects, eq(subjects.id, assessments.subjectId))
        .innerJoin(assessmentTypes, eq(assessmentTypes.id, assessments.assessmentTypeId))
        .where(
          and(
            eq(assessments.schoolId, schoolId),
            eq(assessments.academicYearId, year.id),
            eq(assessments.termId, term.id),
          ),
        )
        .orderBy(desc(assessments.createdAt))
        .limit(20)
    : [];
  const assignedAssessments = assessmentRows.filter((assessment) =>
    assignments.some(
      (assignment) =>
        assignment.streamName === assessment.streamName &&
        assignment.subjectName === assessment.subjectName,
    ),
  );

  const days = ["", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const cards = [
    { label: "Assigned classes", value: assignments.length, icon: Users },
    { label: "Lessons this term", value: timetable.length, icon: CalendarDays },
    { label: "Assessments to grade", value: assignedAssessments.filter((a) => a.status !== "closed" && a.status !== "published").length, icon: ClipboardList },
  ];

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-slate-950 px-6 py-8 text-white shadow-sm">
        <p className="text-sm font-medium text-emerald-300">Teacher workspace</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">
          Welcome, {teacher?.firstName ?? user.firstName}
        </h1>
        <p className="mt-2 text-sm text-slate-300">
          {year?.name ?? "Academic year not configured"}{term ? ` · ${term.name}` : ""}
        </p>
      </section>

      {!teacher && (
        <section className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
          Your account is authorised as a teacher, but no staff profile matches {user.email}. Ask an administrator to link your staff email.
        </section>
      )}

      <section className="grid gap-4 sm:grid-cols-3">
        {cards.map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <Icon className="h-5 w-5 text-blue-700" />
            <p className="mt-4 text-2xl font-bold text-slate-950">{value}</p>
            <p className="mt-1 text-sm text-slate-500">{label}</p>
          </div>
        ))}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div><h2 className="font-semibold text-slate-950">My timetable</h2><p className="text-xs text-slate-500">Your scheduled lessons</p></div>
            <Link href="/timetable" className="text-xs font-semibold text-blue-700 hover:underline">Full timetable</Link>
          </div>
          <div className="divide-y divide-slate-100">
            {timetable.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
                <div><p className="font-medium text-slate-900">{days[entry.day]} · {entry.period}</p><p className="text-xs text-slate-500">{entry.subject} · {entry.stream}</p></div>
                <span className="whitespace-nowrap text-xs text-slate-400">{entry.startsAt}–{entry.endsAt}</span>
              </div>
            ))}
            {!timetable.length && <p className="px-5 py-8 text-sm text-slate-500">No lessons scheduled for the current term.</p>}
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div><h2 className="font-semibold text-slate-950">Assigned classes</h2><p className="text-xs text-slate-500">Classes and subjects under your care</p></div>
            <Link href="/attendance" className="text-xs font-semibold text-blue-700 hover:underline">Attendance</Link>
          </div>
          <div className="divide-y divide-slate-100">
            {assignments.map((assignment) => (
              <div key={assignment.id} className="flex items-center justify-between gap-3 px-5 py-3">
                <div><p className="text-sm font-medium text-slate-900">{assignment.className} · {assignment.streamName}</p><p className="text-xs text-slate-500">{assignment.subjectName ?? "Class teacher"}</p></div>
                <Link href={`/attendance/take?streamId=${assignment.streamId}`} className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">Take attendance</Link>
              </div>
            ))}
            {!assignments.length && <p className="px-5 py-8 text-sm text-slate-500">No class assignments found for this academic year.</p>}
          </div>
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><div><h2 className="font-semibold text-slate-950">Assessment entry</h2><p className="text-xs text-slate-500">Open assessments for your subjects</p></div><ClipboardList className="h-5 w-5 text-indigo-600" /></div>
          <div className="divide-y divide-slate-100">
            {assignedAssessments.slice(0, 5).map((assessment) => <Link key={assessment.id} href={`/assessments/${assessment.id}`} className="flex items-center justify-between px-5 py-3 text-sm hover:bg-slate-50"><span><span className="font-medium text-slate-900">{assessment.name}</span><span className="ml-2 text-xs text-slate-500">{assessment.streamName} · {assessment.subjectName}</span></span><span className="text-xs font-semibold capitalize text-indigo-700">{assessment.status}</span></Link>)}
            {!assignedAssessments.length && <p className="px-5 py-8 text-sm text-slate-500">No assessments are assigned to your classes.</p>}
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><div><h2 className="font-semibold text-slate-950">Announcements</h2><p className="text-xs text-slate-500">Updates for staff and the school</p></div><Bell className="h-5 w-5 text-amber-500" /></div>
          <div className="divide-y divide-slate-100">
            {allNotices.map((notice) => <div key={notice.id} className="px-5 py-3"><p className="text-sm font-medium text-slate-900">{notice.title}</p><p className="mt-1 line-clamp-2 text-xs text-slate-500">{notice.body}</p></div>)}
            {!allNotices.length && <p className="px-5 py-8 text-sm text-slate-500">No announcements have been published.</p>}
          </div>
          <Link href="/communications" className="flex items-center gap-1 px-5 py-3 text-xs font-semibold text-blue-700 hover:underline"><CheckCircle2 className="h-3.5 w-3.5" /> View all announcements</Link>
        </section>
      </div>
    </div>
  );
}
