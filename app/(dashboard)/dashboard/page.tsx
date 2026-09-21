export const dynamic = "force-dynamic";

import {
  Activity,
  ArrowRight,
  BarChart3,
  BookOpen,
  Building2,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  GraduationCap,
  Users,
  UsersRound,
} from "lucide-react";
import Link from "next/link";
import { and, count, eq } from "drizzle-orm";

import { db } from "@/db";
import {
  academicYears,
  classLevels,
  staff,
  streams,
  students,
  subjects,
  terms,
} from "@/db/schema";
import { requireCurrentSchool } from "@/lib/current-school";
import { requireTeacherScope } from "@/lib/authorization";
import TeacherDashboard from "../teacher/TeacherDashboard";

export default async function Home() {
  const school = await requireCurrentSchool();
  const currentUser = await requireTeacherScope(school.id);

  if (currentUser.role === "teacher") {
    return <TeacherDashboard schoolId={school.id} user={currentUser} />;
  }

  const [
    currentYearResult,
    currentTermResult,
    studentCountResult,
    staffCountResult,
    classLevelCountResult,
    streamCountResult,
    subjectCountResult,
  ] = await Promise.all([
    db
      .select()
      .from(academicYears)
      .where(
        and(
          eq(academicYears.schoolId, school.id),
          eq(academicYears.isCurrent, true),
        ),
      )
      .limit(1),

    db
      .select()
      .from(terms)
      .innerJoin(
        academicYears,
        eq(terms.academicYearId, academicYears.id),
      )
      .where(
        and(
          eq(academicYears.schoolId, school.id),
          eq(academicYears.isCurrent, true),
          eq(terms.isCurrent, true),
        ),
      )
      .limit(1),

    db
      .select({ value: count() })
      .from(students)
      .where(eq(students.schoolId, school.id)),

    db
      .select({ value: count() })
      .from(staff)
      .where(eq(staff.schoolId, school.id)),

    db
      .select({ value: count() })
      .from(classLevels)
      .where(eq(classLevels.schoolId, school.id)),

    db
      .select({ value: count() })
      .from(streams)
      .innerJoin(
        classLevels,
        eq(streams.classLevelId, classLevels.id),
      )
      .where(eq(classLevels.schoolId, school.id)),

    db
      .select({ value: count() })
      .from(subjects)
      .where(eq(subjects.schoolId, school.id)),
  ]);

  const currentYear = currentYearResult[0];
  const currentTerm = currentTermResult[0]?.terms;

  const stats = [
    {
      label: "Students",
      value: studentCountResult[0]?.value ?? 0,
      description: "Enrolled students",
      icon: Users,
      href: "/students",
    },
    {
      label: "Staff",
      value: staffCountResult[0]?.value ?? 0,
      description: "Teaching & support staff",
      icon: UsersRound,
      href: "/staff",
    },
    {
      label: "Class Levels",
      value: classLevelCountResult[0]?.value ?? 0,
      description: "Configured levels",
      icon: GraduationCap,
      href: "/academics/classes",
    },
    {
      label: "Streams",
      value: streamCountResult[0]?.value ?? 0,
      description: "Active streams",
      icon: Building2,
      href: "/academics/classes",
    },
    {
      label: "Subjects",
      value: subjectCountResult[0]?.value ?? 0,
      description: "Configured subjects",
      icon: BookOpen,
      href: "/academics/subjects",
    },
  ];

  return (
    <div className="space-y-6">
      {/* PAGE HEADER */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="relative px-6 py-7 sm:px-8">
          <div className="absolute right-0 top-0 h-40 w-40 translate-x-12 -translate-y-12 rounded-full bg-[#fff8d9]" />
          <div className="absolute right-20 top-12 h-24 w-24 rounded-full bg-[#e8f3ed]" />

          <div className="relative">
            <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
              <div className="min-w-0">
                <div className="mb-3 inline-flex items-center gap-2 rounded-md bg-[#e8f3ed] px-2.5 py-1.5 text-xs font-bold text-[#006b3f]">
                  <Activity className="h-3.5 w-3.5" />
                  SchoolOS Dashboard
                </div>

                <h1 className="max-w-3xl text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
                  {school.name}
                </h1>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                  Manage your school&apos;s academic structure, people,
                  assessments and results from one central workspace.
                </p>
              </div>

              <div className="flex shrink-0 flex-wrap gap-3">
                <Link
                  href="/academics/classes"
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#006b3f] px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#005530] focus:outline-none focus:ring-2 focus:ring-[#fcd116] focus:ring-offset-2"
                >
                  <GraduationCap className="h-4 w-4" />
                  Manage Classes
                </Link>

                <Link
                  href="/students"
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#006b3f]/25 bg-white px-4 py-2.5 text-sm font-bold text-[#006b3f] shadow-sm transition-colors hover:bg-[#fff8d9] hover:text-[#003d22] focus:outline-none focus:ring-2 focus:ring-[#fcd116] focus:ring-offset-2"
                >
                  <Users className="h-4 w-4" />
                  Students
                </Link>
              </div>
            </div>

            {/* Current academic context */}
            <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:max-w-2xl">
              <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-blue-700 shadow-sm ring-1 ring-slate-200">
                  <CalendarDays className="h-4 w-4" />
                </div>

                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Academic Year
                  </p>

                  <p className="mt-0.5 truncate text-sm font-semibold text-slate-900">
                    {currentYear?.name ?? "Not set"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-indigo-700 shadow-sm ring-1 ring-slate-200">
                  <ClipboardList className="h-4 w-4" />
                </div>

                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Current Term
                  </p>

                  <p className="mt-0.5 truncate text-sm font-semibold text-slate-900">
                    {currentTerm?.name ?? "Not set"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STATISTICS */}
      <section aria-label="School statistics">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-950">
              School overview
            </h2>

            <p className="mt-0.5 text-xs text-slate-500">
              Current configuration and population
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {stats.map((stat) => {
            const Icon = stat.icon;

            return (
              <Link
                key={stat.label}
                href={stat.href}
                className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#006b3f]/30 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#fcd116] focus:ring-offset-2"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#e8f3ed] text-[#006b3f]">
                    <Icon className="h-5 w-5" strokeWidth={2} />
                  </div>

                  <ArrowRight className="h-4 w-4 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-[#006b3f]" />
                </div>

                <p className="mt-5 text-3xl font-bold tracking-tight text-slate-950">
                  {stat.value}
                </p>

                <p className="mt-1 text-sm font-semibold text-slate-800">
                  {stat.label}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  {stat.description}
                </p>
              </Link>
            );
          })}
        </div>
      </section>

      {/* LOWER DASHBOARD */}
      <section className="grid gap-6 lg:grid-cols-2">
        {/* Academic structure */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
            <div>
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#fff8d9] text-[#111111]">
                  <GraduationCap className="h-4.5 w-4.5" />
                </div>

                <h2 className="text-sm font-bold text-slate-950">
                  Academic structure
                </h2>
              </div>

              <p className="mt-2 text-xs leading-5 text-slate-500">
                The foundational academic structure currently configured for
                this school.
              </p>
            </div>

            <Link
              href="/academics/classes"
              className="inline-flex items-center gap-1 text-xs font-bold text-[#006b3f] hover:text-[#ce1126]"
            >
              View
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100 px-6">
            <div className="flex items-center justify-between py-4">
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-[#006b3f]" />

                <span className="text-sm text-slate-600">
                  Class levels
                </span>
              </div>

              <span className="text-sm font-bold text-slate-950">
                {classLevelCountResult[0]?.value ?? 0}
              </span>
            </div>

            <div className="flex items-center justify-between py-4">
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-[#ce1126]" />

                <span className="text-sm text-slate-600">
                  Streams
                </span>
              </div>

              <span className="text-sm font-bold text-slate-950">
                {streamCountResult[0]?.value ?? 0}
              </span>
            </div>

            <div className="flex items-center justify-between py-4">
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-slate-500" />

                <span className="text-sm text-slate-600">
                  Subjects
                </span>
              </div>

              <span className="text-sm font-bold text-slate-950">
                {subjectCountResult[0]?.value ?? 0}
              </span>
            </div>
          </div>
        </div>

        {/* System status */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-6 py-5">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                <CheckCircle2 className="h-4.5 w-4.5" />
              </div>

              <div>
                <h2 className="text-sm font-bold text-slate-950">
                  System status
                </h2>

                <p className="mt-0.5 text-xs text-slate-500">
                  Current application environment
                </p>
              </div>
            </div>
          </div>

          <div className="divide-y divide-slate-100 px-6">
            <div className="flex items-center justify-between py-4">
              <div className="flex items-center gap-3">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                </span>

                <span className="text-sm text-slate-600">
                  Database
                </span>
              </div>

              <span className="text-xs font-bold text-emerald-700">
                Connected
              </span>
            </div>

            <div className="flex items-center justify-between py-4">
              <div className="flex items-center gap-3">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />

                <span className="text-sm text-slate-600">
                  School context
                </span>
              </div>

              <span className="text-xs font-bold text-emerald-700">
                Active
              </span>
            </div>

            <div className="flex items-center justify-between py-4">
              <div className="flex items-center gap-3">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />

                <span className="text-sm text-slate-600">
                  Authentication
                </span>
              </div>

              <span className="text-xs font-bold text-amber-700">
                Development mode
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Quick actions */}
      <section className="rounded-2xl border border-[#006b3f]/20 bg-[#e8f3ed] p-6 shadow-sm sm:p-7">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#006b3f]">
              Quick actions
            </p>

            <h2 className="mt-1 text-lg font-bold tracking-tight text-[#111111]">
              Continue managing your school
            </h2>

            <p className="mt-1 text-sm text-slate-600">
              Jump directly into the areas you use most.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/students"
              className="inline-flex items-center gap-2 rounded-lg bg-[#006b3f] px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#005530] focus:outline-none focus:ring-2 focus:ring-[#fcd116] focus:ring-offset-2"
            >
              <Users className="h-4 w-4" />
              Students
            </Link>

            <Link
              href="/assessments/results"
              className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-bold text-[#111111] transition-colors hover:bg-[#fff8d9] focus:outline-none focus:ring-2 focus:ring-[#fcd116] focus:ring-offset-2"
            >
              <BarChart3 className="h-4 w-4" />
              Results
            </Link>

            <Link
              href="/academics/subjects"
              className="inline-flex items-center gap-2 rounded-lg border border-[#006b3f]/35 bg-white/70 px-4 py-2.5 text-sm font-bold text-[#006b3f] transition-colors hover:border-[#006b3f] hover:bg-white focus:outline-none focus:ring-2 focus:ring-[#fcd116] focus:ring-offset-2"
            >
              <BookOpen className="h-4 w-4" />
              Subjects
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}