import Link from "next/link";
import { asc, eq } from "drizzle-orm";

import { db } from "@/db";
import { classLevels, streams } from "@/db/schema";
import { requireCurrentSchool } from "@/lib/current-school";

export default async function ClassesPage() {
  const school = await requireCurrentSchool();

  const classes = await db
    .select()
    .from(classLevels)
    .where(eq(classLevels.schoolId, school.id))
    .orderBy(asc(classLevels.sortOrder));

  const classIds = classes.map((classLevel) => classLevel.id);

  const allStreams =
    classIds.length > 0
      ? await db
          .select()
          .from(streams)
          .where(
            eq(streams.classLevelId, classIds[0]),
          )
      : [];

  const streamsByClass = new Map<
    string,
    typeof allStreams
  >();

  if (classIds.length > 0) {
    const streamRows = await db
      .select()
      .from(streams)
      .where(
        eq(streams.classLevelId, classIds[0]),
      );

    streamsByClass.set(
      classIds[0],
      streamRows,
    );

    for (const classLevel of classes.slice(1)) {
      const classStreams = await db
        .select()
        .from(streams)
        .where(
          eq(
            streams.classLevelId,
            classLevel.id,
          ),
        );

      streamsByClass.set(
        classLevel.id,
        classStreams,
      );
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-8 lg:px-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link
            href="/academics"
            className="text-sm font-medium text-slate-500 hover:text-slate-900"
          >
            ← Back to academics
          </Link>

          <h1 className="mt-4 text-2xl font-semibold tracking-tight text-slate-950">
            Classes & Streams
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Manage class levels and streams for{" "}
            {school.name}.
          </p>
        </div>

        <Link
          href="/academics/classes/new"
          className="rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
        >
          Add class
        </Link>
      </div>

      {classes.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
          <h2 className="font-semibold text-slate-950">
            No classes yet
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Create the first class level for this school.
          </p>

          <Link
            href="/academics/classes/new"
            className="mt-5 inline-flex rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white"
          >
            Add class
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="divide-y divide-slate-200">
            {classes.map((classLevel) => {
              const classStreams =
                streamsByClass.get(classLevel.id) ?? [];

              return (
                <div
                  key={classLevel.id}
                  className="px-6 py-5"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="flex items-center gap-3">
                        <h2 className="text-base font-semibold text-slate-950">
                          {classLevel.name}
                        </h2>

                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium capitalize text-slate-600">
                          {classLevel.category}
                        </span>
                      </div>

                      <p className="mt-1 text-sm text-slate-500">
                        {classStreams.length}{" "}
                        {classStreams.length === 1
                          ? "stream"
                          : "streams"}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <Link
                        href={`/academics/classes/${classLevel.id}`}
                        className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                      >
                        Manage
                      </Link>

                      <Link
                        href={`/academics/classes/${classLevel.id}/streams/new`}
                        className="rounded-lg bg-slate-950 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                      >
                        Add stream
                      </Link>
                    </div>
                  </div>

                  {classStreams.length > 0 && (
                    <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {classStreams.map((stream) => (
                        <div
                          key={stream.id}
                          className="rounded-lg border border-slate-200 px-4 py-3"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-slate-900">
                              {classLevel.name}{" "}
                              {stream.name}
                            </span>

                            <span className="text-xs text-slate-500">
                              {stream.capacity} seats
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}