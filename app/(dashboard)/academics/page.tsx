import Link from "next/link";
import { desc, eq } from "drizzle-orm";

import { db } from "@/db";
import {
  academicYears,
  classLevels,
  streams,
  subjects,
} from "@/db/schema";
import { requireCurrentSchool } from "@/lib/current-school";

export default async function AcademicsPage() {
  const school = await requireCurrentSchool();

  const [years, classes, streamRows, subjectRows] =
    await Promise.all([
      db
        .select()
        .from(academicYears)
        .where(eq(academicYears.schoolId, school.id))
        .orderBy(desc(academicYears.startDate)),

      db
        .select()
        .from(classLevels)
        .where(eq(classLevels.schoolId, school.id))
        .orderBy(classLevels.sortOrder),

      db
        .select({
          id: streams.id,
          name: streams.name,
          classLevelId: streams.classLevelId,
        })
        .from(streams)
        .innerJoin(
          classLevels,
          eq(streams.classLevelId, classLevels.id),
        )
        .where(eq(classLevels.schoolId, school.id)),

      db
        .select()
        .from(subjects)
        .where(eq(subjects.schoolId, school.id))
        .orderBy(subjects.name),
    ]);

  const currentYear = years.find(
    (year) => year.isCurrent,
  );

  const streamsByClass = new Map<
    string,
    typeof streamRows
  >();

  for (const stream of streamRows) {
    const existing =
      streamsByClass.get(stream.classLevelId) ?? [];

    existing.push(stream);

    streamsByClass.set(
      stream.classLevelId,
      existing,
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <p className="text-sm font-medium text-slate-500">
          School Administration
        </p>

        <div className="mt-1 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-950">
              Academic Management
            </h1>

            <p className="mt-2 max-w-2xl text-sm text-slate-500">
              Manage academic years, terms, classes, streams,
              and subjects for {school.name}.
            </p>
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AcademicCard
          title="Academic Years"
          value={years.length}
          description={
            currentYear
              ? `${currentYear.name} is current`
              : "No current academic year"
          }
          href="/academics/years"
        />

        <AcademicCard
          title="Class Levels"
          value={classes.length}
          description="Configured class levels"
          href="/academics/classes"
        />

        <AcademicCard
          title="Streams"
          value={streamRows.length}
          description="Class streams configured"
          href="/academics/classes"
        />

        <AcademicCard
          title="Subjects"
          value={subjectRows.length}
          description="Subjects available"
          href="/academics/subjects"
        />
      </div>

      {/* Main information panels */}
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* Current academic year */}
        <section className="rounded-xl border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-6 py-5">
            <h2 className="font-semibold text-slate-950">
              Current academic year
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              The academic year currently used by the school.
            </p>
          </div>

          <div className="p-6">
            {currentYear ? (
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium text-slate-950">
                    {currentYear.name}
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    {currentYear.startDate} to{" "}
                    {currentYear.endDate}
                  </p>
                </div>

                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  Current
                </span>
              </div>
            ) : (
              <div>
                <p className="text-sm text-slate-500">
                  No academic year has been marked as current.
                </p>

                <Link
                  href="/academics/years/new"
                  className="mt-4 inline-flex rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                >
                  Create academic year
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* Academic structure */}
        <section className="rounded-xl border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-6 py-5">
            <h2 className="font-semibold text-slate-950">
              Academic structure
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Configure the academic structure used by the
              school.
            </p>
          </div>

          <div className="grid gap-3 p-6 sm:grid-cols-2">
            <QuickLink
              href="/academics/years"
              title="Academic years"
              description="Years and terms"
            />

            <QuickLink
              href="/academics/classes"
              title="Classes & streams"
              description="Class levels and streams"
            />

            <QuickLink
              href="/academics/subjects"
              title="Subjects"
              description="School subject catalogue"
            />

            <QuickLink
              href="/academics/years"
              title="Terms"
              description="Manage school terms"
            />
          </div>
        </section>
      </div>

      {/* Current class structure */}
      <section className="mt-8 overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-6 py-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="font-semibold text-slate-950">
                Current class structure
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Classes and streams currently configured for
                this school.
              </p>
            </div>

            <Link
              href="/academics/classes"
              className="text-sm font-medium text-slate-600 hover:text-slate-950"
            >
              Manage classes →
            </Link>
          </div>
        </div>

        {classes.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <p className="text-sm text-slate-500">
              No class levels have been configured yet.
            </p>

            <Link
              href="/academics/classes"
              className="mt-4 inline-flex rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Configure classes
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {classes.map((classLevel) => {
              const classStreams =
                streamsByClass.get(classLevel.id) ?? [];

              return (
                <div
                  key={classLevel.id}
                  className="flex flex-col gap-4 px-6 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <div className="flex items-center gap-3">
                      <p className="font-medium text-slate-900">
                        {classLevel.name}
                      </p>

                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium capitalize text-slate-600">
                        {classLevel.category}
                      </span>
                    </div>

                    <p className="mt-1 text-xs text-slate-400">
                      {classStreams.length}{" "}
                      {classStreams.length === 1
                        ? "stream"
                        : "streams"}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {classStreams.length > 0 ? (
                      classStreams.map((stream) => (
                        <span
                          key={stream.id}
                          className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700"
                        >
                          {stream.name}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-400">
                        No streams configured
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Subjects */}
      <section className="mt-8 rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-6 py-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="font-semibold text-slate-950">
                Subject catalogue
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Subjects currently available to the school.
              </p>
            </div>

            <Link
              href="/academics/subjects"
              className="text-sm font-medium text-slate-600 hover:text-slate-950"
            >
              Manage subjects →
            </Link>
          </div>
        </div>

        {subjectRows.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <p className="text-sm text-slate-500">
              No subjects have been configured yet.
            </p>
          </div>
        ) : (
          <div className="grid gap-3 p-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {subjectRows.map((subject) => (
              <div
                key={subject.id}
                className="rounded-lg border border-slate-200 px-4 py-3"
              >
                <p className="text-sm font-medium text-slate-900">
                  {subject.name}
                </p>

                {subject.code && (
                  <p className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-400">
                    {subject.code}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function AcademicCard({
  title,
  value,
  description,
  href,
}: {
  title: string;
  value: number;
  description: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-xl border border-slate-200 bg-white p-5 transition hover:border-slate-300 hover:shadow-sm"
    >
      <p className="text-sm font-medium text-slate-500">
        {title}
      </p>

      <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
        {value}
      </p>

      <p className="mt-2 text-xs text-slate-500">
        {description}
      </p>
    </Link>
  );
}

function QuickLink({
  href,
  title,
  description,
}: {
  href: string;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-lg border border-slate-200 p-4 transition hover:border-slate-300 hover:bg-slate-50"
    >
      <p className="text-sm font-medium text-slate-900">
        {title}
      </p>

      <p className="mt-1 text-xs text-slate-500">
        {description}
      </p>
    </Link>
  );
}