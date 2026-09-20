import Link from "next/link";
import { and, asc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";

import { db } from "@/db";
import {
  academicYears,
  classLevels,
  staff,
  streams,
  subjects,
  teacherAssignments,
} from "@/db/schema";
import { requireCurrentSchool } from "@/lib/current-school";

import DeleteAssignmentButton from "./assignments/DeleteAssignmentButton";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type Props = {
  params: Promise<{
    id: string;
    streamId: string;
  }>;
};
export default async function StreamDetailPage({
  params,
}: Props) {
  const { id, streamId } = await params;

if (!UUID_REGEX.test(id) || !UUID_REGEX.test(streamId)) {
  notFound();
}

const school = await requireCurrentSchool();
  /*
   * Load stream and verify that it belongs to
   * the current school and requested class.
   */
  const [streamResult] = await db
    .select({
      stream: streams,
      classLevel: classLevels,
    })
    .from(streams)
    .innerJoin(
      classLevels,
      eq(
        streams.classLevelId,
        classLevels.id,
      ),
    )
    .where(
      and(
        eq(streams.id, streamId),
        eq(streams.classLevelId, id),
        eq(
          classLevels.schoolId,
          school.id,
        ),
      ),
    )
    .limit(1);

  if (!streamResult) {
    notFound();
  }

  /*
   * Get current academic year.
   */
  const [currentYear] = await db
    .select({
      id: academicYears.id,
      name: academicYears.name,
    })
    .from(academicYears)
    .where(
      and(
        eq(
          academicYears.schoolId,
          school.id,
        ),
        eq(
          academicYears.isCurrent,
          true,
        ),
      ),
    )
    .limit(1);

  /*
   * Load all teaching assignments for this stream
   * in the current academic year.
   */
  const assignments = currentYear
    ? await db
        .select({
          id: teacherAssignments.id,

          isClassTeacher:
            teacherAssignments.isClassTeacher,

          staffId: staff.id,

          firstName: staff.firstName,
          middleName: staff.middleName,
          lastName: staff.lastName,

          subjectName: subjects.name,
          subjectCode: subjects.code,
        })
        .from(teacherAssignments)
        .innerJoin(
          staff,
          eq(
            teacherAssignments.staffId,
            staff.id,
          ),
        )
        .leftJoin(
          subjects,
          eq(
            teacherAssignments.subjectId,
            subjects.id,
          ),
        )
        .where(
          and(
            eq(
              teacherAssignments.streamId,
              streamId,
            ),
            eq(
              teacherAssignments.academicYearId,
              currentYear.id,
            ),
            eq(
              staff.schoolId,
              school.id,
            ),
          ),
        )
        .orderBy(
          asc(subjects.name),
          asc(staff.lastName),
          asc(staff.firstName),
        )
    : [];

  const classTeacher = assignments.find(
    (assignment) =>
      assignment.isClassTeacher,
  );

  const subjectAssignments =
    assignments.filter(
      (assignment) =>
        !assignment.isClassTeacher,
    );

  const getStaffName = (assignment: {
    firstName: string;
    middleName: string | null;
    lastName: string;
  }) =>
    [
      assignment.firstName,
      assignment.middleName,
      assignment.lastName,
    ]
      .filter(Boolean)
      .join(" ");

  return (
    <div className="mx-auto max-w-6xl px-6 py-8 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href={`/academics/classes/${id}`}
          className="text-sm font-medium text-slate-500 hover:text-slate-900"
        >
          ← Back to{" "}
          {streamResult.classLevel.name}
        </Link>

        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">
              {streamResult.classLevel.name}
            </p>

            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
              Stream {streamResult.stream.name}
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Capacity:{" "}
              {streamResult.stream.capacity ??
                "Not set"}
              {currentYear
                ? ` • ${currentYear.name}`
                : " • No current academic year"}
            </p>
          </div>

          {currentYear ? (
            <Link
              href={`/academics/classes/${id}/streams/${streamId}/assignments/new`}
              className="inline-flex items-center justify-center rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Add teaching assignment
            </Link>
          ) : null}
        </div>
      </div>

      {/* No current year */}
      {!currentYear ? (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
          <p className="font-medium text-amber-900">
            No current academic year
          </p>

          <p className="mt-1 text-sm text-amber-800">
            Set an academic year as current before
            assigning teachers.
          </p>
        </div>
      ) : null}

      {/* Overview */}
      <div className="mb-6 grid gap-6 md:grid-cols-3">
        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Stream
          </p>

          <p className="mt-3 text-xl font-semibold text-slate-950">
            {streamResult.classLevel.name}{" "}
            {streamResult.stream.name}
          </p>

          <p className="mt-1 text-sm text-slate-500">
            {streamResult.stream.capacity ??
              "No"}{" "}
            student capacity
          </p>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Class teacher
          </p>

          {classTeacher ? (
            <div className="mt-3">
              <p className="font-semibold text-slate-950">
                {getStaffName(classTeacher)}
              </p>

              <p className="mt-1 text-sm text-emerald-600">
                Assigned
              </p>
            </div>
          ) : (
            <div className="mt-3">
              <p className="font-medium text-slate-700">
                Not assigned
              </p>

              <p className="mt-1 text-sm text-amber-600">
                Action required
              </p>
            </div>
          )}
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Subject teachers
          </p>

          <p className="mt-3 text-2xl font-semibold text-slate-950">
            {subjectAssignments.length}
          </p>

          <p className="mt-1 text-sm text-slate-500">
            Active assignments
          </p>
        </section>
      </div>

      {/* Class teacher */}
      <section className="mb-6 overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-6 py-5">
          <h2 className="font-semibold text-slate-950">
            Class teacher
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            The teacher responsible for the overall
            stream.
          </p>
        </div>

        {!classTeacher ? (
          <div className="px-6 py-10 text-center">
            <p className="font-medium text-slate-900">
              No class teacher assigned
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Assign a class teacher to this stream.
            </p>

            {currentYear ? (
              <Link
                href={`/academics/classes/${id}/streams/${streamId}/assignments/new`}
                className="mt-4 inline-flex rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
              >
                Add assignment
              </Link>
            ) : null}
          </div>
        ) : (
          <div className="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold text-slate-950">
                {getStaffName(classTeacher)}
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Class teacher
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                href={`/academics/classes/${id}/streams/${streamId}/assignments/${classTeacher.id}/edit`}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Edit
              </Link>

              <DeleteAssignmentButton
                classId={id}
                streamId={streamId}
                assignmentId={
                  classTeacher.id
                }
              />
            </div>
          </div>
        )}
      </section>

      {/* Subject teachers */}
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="flex flex-col gap-4 border-b border-slate-200 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold text-slate-950">
              Subject teachers
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {subjectAssignments.length}{" "}
              {subjectAssignments.length === 1
                ? "assignment"
                : "assignments"}{" "}
              for this academic year.
            </p>
          </div>

          {currentYear ? (
            <Link
              href={`/academics/classes/${id}/streams/${streamId}/assignments/new`}
              className="inline-flex items-center justify-center rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Add teacher
            </Link>
          ) : null}
        </div>

        {subjectAssignments.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <h3 className="font-medium text-slate-950">
              No subject teachers assigned
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              Add the teachers responsible for
              subjects in this stream.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {subjectAssignments.map(
              (assignment) => (
                <div
                  key={assignment.id}
                  className="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-slate-950">
                      {assignment.subjectName ??
                        "Unspecified subject"}
                    </p>

                    {assignment.subjectCode ? (
                      <p className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-400">
                        {assignment.subjectCode}
                      </p>
                    ) : null}

                    <p className="mt-2 text-sm text-slate-600">
                      {getStaffName(
                        assignment,
                      )}
                    </p>
                  </div>

                  <div className="flex shrink-0 flex-wrap gap-2">
                    <Link
                      href={`/academics/classes/${id}/streams/${streamId}/assignments/${assignment.id}/edit`}
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                      Edit
                    </Link>

                    <DeleteAssignmentButton
                      classId={id}
                      streamId={streamId}
                      assignmentId={
                        assignment.id
                      }
                    />
                  </div>
                </div>
              ),
            )}
          </div>
        )}
      </section>
    </div>
  );
}