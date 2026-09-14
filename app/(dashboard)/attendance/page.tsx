import Link from "next/link";
import { asc, eq } from "drizzle-orm";

import { db } from "@/db";
import {
  academicYears,
  classLevels,
  streams,
} from "@/db/schema";
import { requireCurrentSchool } from "@/lib/current-school";

export const dynamic = "force-dynamic";

export default async function AttendancePage() {
  const school = await requireCurrentSchool();

  const [academicYear] = await db
    .select()
    .from(academicYears)
    .where(
      eq(
        academicYears.schoolId,
        school.id,
      ),
    )
    .orderBy(
      asc(academicYears.startDate),
    )
    .limit(1);

  const classRows = await db
    .select({
      id: classLevels.id,
      name: classLevels.name,
      category: classLevels.category,
      sortOrder: classLevels.sortOrder,
      streamId: streams.id,
      streamName: streams.name,
    })
    .from(classLevels)
    .leftJoin(
      streams,
      eq(
        streams.classLevelId,
        classLevels.id,
      ),
    )
    .where(
      eq(
        classLevels.schoolId,
        school.id,
      ),
    )
    .orderBy(
      asc(classLevels.sortOrder),
      asc(streams.name),
    );

  const classes = new Map<
    string,
    {
      id: string;
      name: string;
      category: string;
      streams: {
        id: string;
        name: string;
      }[];
    }
  >();

  for (const row of classRows) {
    if (!classes.has(row.id)) {
      classes.set(row.id, {
        id: row.id,
        name: row.name,
        category: row.category,
        streams: [],
      });
    }

    if (row.streamId) {
      classes.get(row.id)!.streams.push({
        id: row.streamId,
        name: row.streamName!,
      });
    }
  }

  const classList = Array.from(
    classes.values(),
  );

  return (
    <div className="mx-auto max-w-6xl px-6 py-8 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">
              Attendance
            </p>

            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
              Attendance Register
            </h1>

            <p className="mt-2 max-w-2xl text-sm text-slate-500">
              Select a class and stream to take or review
              daily attendance.
            </p>
          </div>

          {academicYear ? (
            <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Academic year
              </p>

              <p className="mt-1 text-sm font-semibold text-slate-900">
                {academicYear.name}
              </p>
            </div>
          ) : null}
        </div>
      </div>

      {/* No academic year */}
      {!academicYear ? (
        <section className="rounded-xl border border-amber-200 bg-amber-50 p-6">
          <h2 className="font-semibold text-amber-950">
            No academic year configured
          </h2>

          <p className="mt-2 text-sm text-amber-800">
            Create an academic year before taking
            attendance.
          </p>

          <Link
            href="/academics/years/new"
            className="mt-4 inline-flex rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Create academic year
          </Link>
        </section>
      ) : classList.length === 0 ? (
        /* No classes */
        <section className="rounded-xl border border-slate-200 bg-white p-12 text-center">
          <h2 className="font-semibold text-slate-950">
            No classes configured
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Configure classes and streams before taking
            attendance.
          </p>

          <Link
            href="/academics/classes"
            className="mt-5 inline-flex rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Manage classes
          </Link>
        </section>
      ) : (
        /* Classes */
        <div className="space-y-4">
          {classList.map((classLevel) => (
            <section
              key={classLevel.id}
              className="overflow-hidden rounded-xl border border-slate-200 bg-white"
            >
              <div className="flex flex-col gap-2 border-b border-slate-200 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="font-semibold text-slate-950">
                      {classLevel.name}
                    </h2>

                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium capitalize text-slate-600">
                      {classLevel.category}
                    </span>
                  </div>

                  <p className="mt-1 text-sm text-slate-500">
                    Select a stream to take attendance.
                  </p>
                </div>

                <span className="text-sm text-slate-400">
                  {classLevel.streams.length}{" "}
                  {classLevel.streams.length === 1
                    ? "stream"
                    : "streams"}
                </span>
              </div>

              {classLevel.streams.length === 0 ? (
                <div className="px-6 py-6">
                  <p className="text-sm text-slate-500">
                    No streams configured for this class.
                  </p>

                  <Link
                    href={`/academics/classes/${classLevel.id}`}
                    className="mt-3 inline-flex text-sm font-medium text-slate-900 hover:underline"
                  >
                    Configure streams →
                  </Link>
                </div>
              ) : (
                <div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-3">
                  {classLevel.streams.map(
                    (stream) => (
                      <Link
                        key={stream.id}
                        href={`/attendance/take?streamId=${stream.id}`}
                        className="group rounded-xl border border-slate-200 p-4 transition hover:border-slate-400 hover:bg-slate-50"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-slate-900">
                              {classLevel.name}{" "}
                              {stream.name}
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              Attendance register
                            </p>
                          </div>

                          <span className="text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-slate-700">
                            →
                          </span>
                        </div>
                      </Link>
                    ),
                  )}
                </div>
              )}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}