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
import AssignmentForm from "./AssignmentForm";

type AssignmentsPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export const dynamic = "force-dynamic";

export default async function StaffAssignmentsPage({
  params,
}: AssignmentsPageProps) {
  const { id } = await params;

  const school = await requireCurrentSchool();

  const [member] = await db
    .select({
      id: staff.id,
      firstName: staff.firstName,
      middleName: staff.middleName,
      lastName: staff.lastName,
      staffNumber: staff.staffNumber,
      status: staff.status,
    })
    .from(staff)
    .where(
      and(
        eq(staff.id, id),
        eq(staff.schoolId, school.id),
      ),
    )
    .limit(1);

  if (!member) {
    notFound();
  }

  const assignments = await db
    .select({
      id: teacherAssignments.id,
      academicYearId: academicYears.id,
      academicYearName: academicYears.name,
      streamId: streams.id,
      streamName: streams.name,
      className: classLevels.name,
      subjectName: subjects.name,
      subjectCode: subjects.code,
      isClassTeacher: teacherAssignments.isClassTeacher,
    })
    .from(teacherAssignments)
    .innerJoin(
      academicYears,
      eq(
        teacherAssignments.academicYearId,
        academicYears.id,
      ),
    )
    .innerJoin(
      streams,
      eq(teacherAssignments.streamId, streams.id),
    )
    .innerJoin(
      classLevels,
      eq(streams.classLevelId, classLevels.id),
    )
    .leftJoin(
      subjects,
      eq(teacherAssignments.subjectId, subjects.id),
    )
    .where(
      and(
        eq(teacherAssignments.staffId, member.id),
        eq(academicYears.schoolId, school.id),
        eq(classLevels.schoolId, school.id),
      ),
    )
    .orderBy(
      asc(academicYears.startDate),
      asc(classLevels.sortOrder),
      asc(streams.name),
    );

  const [academicYearRows, streamRows, subjectRows] =
    await Promise.all([
      db
        .select({
          id: academicYears.id,
          name: academicYears.name,
          isCurrent: academicYears.isCurrent,
        })
        .from(academicYears)
        .where(eq(academicYears.schoolId, school.id))
        .orderBy(asc(academicYears.startDate)),

      db
        .select({
          id: streams.id,
          name: streams.name,
          className: classLevels.name,
          classLevelId: classLevels.id,
          sortOrder: classLevels.sortOrder,
        })
        .from(streams)
        .innerJoin(
          classLevels,
          eq(streams.classLevelId, classLevels.id),
        )
        .where(eq(classLevels.schoolId, school.id))
        .orderBy(
          asc(classLevels.sortOrder),
          asc(streams.name),
        ),

      db
        .select({
          id: subjects.id,
          name: subjects.name,
          code: subjects.code,
        })
        .from(subjects)
        .where(eq(subjects.schoolId, school.id))
        .orderBy(asc(subjects.name)),
    ]);

  const fullName = [
    member.firstName,
    member.middleName,
    member.lastName,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-8 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <Link
            href={`/staff/${member.id}`}
            className="text-sm font-medium text-slate-500 transition hover:text-slate-900"
          >
            ← Back to staff profile
          </Link>

          <div className="mt-6">
            <p className="text-sm font-medium text-slate-500">
              Teacher Management
            </p>

            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
              Teacher assignments
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Manage academic assignments for{" "}
              <span className="font-medium text-slate-700">
                {fullName}
              </span>{" "}
              ({member.staffNumber}).
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm lg:col-span-2">
            <div className="border-b border-slate-200 px-6 py-5">
              <h2 className="text-base font-semibold text-slate-950">
                Current assignments
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Subjects and classes assigned to this staff member.
              </p>
            </div>

            {assignments.length === 0 ? (
              <div className="px-6 py-14 text-center">
                <div className="mx-auto max-w-md">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                    <span className="text-lg font-semibold text-slate-500">
                      T
                    </span>
                  </div>

                  <h3 className="mt-4 text-base font-semibold text-slate-950">
                    No assignments yet
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Assign this staff member to a class and subject
                    using the form.
                  </p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left">
                  <thead className="border-b border-slate-200 bg-slate-50">
                    <tr>
                      <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Academic year
                      </th>

                      <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Class
                      </th>

                      <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Subject
                      </th>

                      <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Role
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {assignments.map((assignment) => (
                      <tr
                        key={assignment.id}
                        className="hover:bg-slate-50"
                      >
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-700">
                          {assignment.academicYearName}
                        </td>

                        <td className="whitespace-nowrap px-6 py-4">
                          <p className="text-sm font-medium text-slate-900">
                            {assignment.className}
                          </p>

                          <p className="mt-0.5 text-xs text-slate-500">
                            {assignment.streamName}
                          </p>
                        </td>

                        <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-700">
                          {assignment.subjectName || (
                            <span className="text-slate-400">
                              No subject
                            </span>
                          )}

                          {assignment.subjectCode && (
                            <span className="ml-2 text-xs text-slate-400">
                              {assignment.subjectCode}
                            </span>
                          )}
                        </td>

                        <td className="whitespace-nowrap px-6 py-4">
                          {assignment.isClassTeacher ? (
                            <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                              Class teacher
                            </span>
                          ) : (
                            <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                              Subject teacher
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <AssignmentForm
            staffId={member.id}
            academicYears={academicYearRows}
            streams={streamRows}
            subjects={subjectRows}
          />
        </div>
      </div>
    </main>
  );
}