import Link from "next/link";
import { asc, count, eq } from "drizzle-orm";
import { notFound } from "next/navigation";

import { db } from "@/db";
import {
  classLevels,
  classSubjects,
  streams,
} from "@/db/schema";
import { requireCurrentSchool } from "@/lib/current-school";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ClassDetailPage({
  params,
}: Props) {
  const { id } = await params;
  const school = await requireCurrentSchool();

  const [classLevel] = await db
    .select()
    .from(classLevels)
    .where(eq(classLevels.id, id))
    .limit(1);

  if (
    !classLevel ||
    classLevel.schoolId !== school.id
  ) {
    notFound();
  }

  const [classStreams, [{ subjectCount }]] =
    await Promise.all([
      db
        .select()
        .from(streams)
        .where(
          eq(
            streams.classLevelId,
            classLevel.id,
          ),
        )
        .orderBy(asc(streams.name)),

      db
        .select({
          subjectCount: count(classSubjects.id),
        })
        .from(classSubjects)
        .where(
          eq(
            classSubjects.classLevelId,
            classLevel.id,
          ),
        ),
    ]);

  const streamCount = classStreams.length;

  const curriculumCount = Number(
    subjectCount ?? 0,
  );

  return (
    <div className="mx-auto max-w-5xl px-6 py-8 lg:px-8">
      <div className="mb-8">
        <Link
          href="/academics/classes"
          className="text-sm font-medium text-slate-500 hover:text-slate-900"
        >
          ← Back to classes
        </Link>

        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-tight text-slate-950">
                {classLevel.name}
              </h1>

              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium capitalize text-slate-600">
                {classLevel.category}
              </span>
            </div>

            <p className="mt-2 text-sm text-slate-500">
              Manage this class level, curriculum, and
              streams.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href={`/academics/classes/${classLevel.id}/edit`}
              className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Edit class
            </Link>

            <Link
              href={`/academics/classes/${classLevel.id}/subjects`}
              className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Curriculum
            </Link>

            <Link
              href={`/academics/classes/${classLevel.id}/streams/new`}
              className="rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Add stream
            </Link>
          </div>
        </div>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2">
        <Link
          href={`/academics/classes/${classLevel.id}/subjects`}
          className="rounded-xl border border-slate-200 bg-white p-5 transition hover:border-slate-300 hover:shadow-sm"
        >
          <p className="text-sm font-medium text-slate-500">
            Curriculum
          </p>

          <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
            {curriculumCount}
          </p>

          <p className="mt-1 text-sm text-slate-500">
            {curriculumCount === 1
              ? "subject offered"
              : "subjects offered"}
          </p>
        </Link>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-sm font-medium text-slate-500">
            Streams
          </p>

          <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
            {streamCount}
          </p>

          <p className="mt-1 text-sm text-slate-500">
            {streamCount === 1
              ? "stream configured"
              : "streams configured"}
          </p>
        </div>
      </div>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <h2 className="font-semibold text-slate-950">
              Streams
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {streamCount}{" "}
              {streamCount === 1
                ? "stream"
                : "streams"}{" "}
              configured.
            </p>
          </div>
        </div>

        {classStreams.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <h3 className="font-medium text-slate-950">
              No streams configured
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              Add a stream such as A, B, or C.
            </p>

            <Link
              href={`/academics/classes/${classLevel.id}/streams/new`}
              className="mt-5 inline-flex rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Add stream
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {classStreams.map((stream) => (
              <div
                key={stream.id}
                className="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium text-slate-900">
                    {classLevel.name} {stream.name}
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    Capacity:{" "}
                    {stream.capacity ?? "Not set"}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                    Active
                  </span>

                  <Link
                    href={`/academics/classes/${classLevel.id}/streams/${stream.id}`}
                    className="rounded-lg bg-slate-950 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                  >
                    Manage teaching
                  </Link>

                  <Link
                    href={`/academics/classes/${classLevel.id}/streams/${stream.id}/edit`}
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Edit
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}