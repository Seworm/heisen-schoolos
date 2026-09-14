import Link from "next/link";
import { notFound } from "next/navigation";
import { and, asc, eq } from "drizzle-orm";

import { db } from "@/db";
import {
  academicYears,
  classLevels,
  studentEnrollments,
  studentPlacements,
  students,
  streams,
} from "@/db/schema";
import { requireCurrentSchool } from "@/lib/current-school";

import TransferPlacementForm from "./TransferPlacementForm";

export const dynamic = "force-dynamic";

type PlacementPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function PlacementPage({
  params,
}: PlacementPageProps) {
  const { id } = await params;

  const school = await requireCurrentSchool();

  const [student] = await db
    .select({
      id: students.id,
      firstName: students.firstName,
      lastName: students.lastName,
      studentNumber: students.studentNumber,
    })
    .from(students)
    .where(
      and(
        eq(students.id, id),
        eq(students.schoolId, school.id),
      ),
    )
    .limit(1);

  if (!student) {
    notFound();
  }

  /*
   * Find the student's active enrollment + placement.
   */

  const [currentPlacement] = await db
    .select({
      enrollmentId: studentEnrollments.id,
      academicYearId: academicYears.id,
      academicYearName: academicYears.name,
      placementId: studentPlacements.id,
      streamId: streams.id,
      streamName: streams.name,
      className: classLevels.name,
    })
    .from(studentPlacements)
    .innerJoin(
      studentEnrollments,
      eq(
        studentPlacements.studentEnrollmentId,
        studentEnrollments.id,
      ),
    )
    .innerJoin(
      academicYears,
      eq(
        studentEnrollments.academicYearId,
        academicYears.id,
      ),
    )
    .innerJoin(
      streams,
      eq(studentPlacements.streamId, streams.id),
    )
    .innerJoin(
      classLevels,
      eq(streams.classLevelId, classLevels.id),
    )
    .where(
      and(
        eq(studentEnrollments.studentId, student.id),
        eq(studentPlacements.status, "active"),
        eq(academicYears.schoolId, school.id),
        eq(classLevels.schoolId, school.id),
      ),
    )
    .limit(1);

  if (!currentPlacement) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-10">
        <div className="mx-auto max-w-3xl">
          <Link
            href={`/students/${student.id}`}
            className="text-sm font-medium text-slate-600 hover:text-slate-900"
          >
            ← Back to student
          </Link>

          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-6">
            <h1 className="text-lg font-semibold text-amber-950">
              No active placement
            </h1>

            <p className="mt-2 text-sm text-amber-800">
              This student does not currently have an active
              placement that can be transferred.
            </p>
          </div>
        </div>
      </main>
    );
  }

  /*
   * Load every stream in the school.
   *
   * The current stream will be disabled in the form.
   */

  const availableStreams = await db
    .select({
      id: streams.id,
      className: classLevels.name,
      streamName: streams.name,
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
    );

  const today = new Date().toISOString().slice(0, 10);

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8">
          <Link
            href={`/students/${student.id}`}
            className="text-sm font-medium text-slate-600 hover:text-slate-900"
          >
            ← Back to student
          </Link>

          <div className="mt-5">
            <p className="text-sm font-medium text-slate-500">
              Student placement
            </p>

            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
              Transfer {student.firstName} {student.lastName}
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              {student.studentNumber}
            </p>
          </div>
        </div>

        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Current placement
            </p>

            <div className="mt-2">
              <p className="text-lg font-semibold text-slate-950">
                {currentPlacement.className}{" "}
                <span className="font-normal text-slate-500">
                  — {currentPlacement.streamName}
                </span>
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Academic year: {currentPlacement.academicYearName}
              </p>
            </div>
          </div>

          <div className="px-6 py-6">
            <TransferPlacementForm
              studentId={student.id}
              enrollmentId={currentPlacement.enrollmentId}
              currentStreamId={currentPlacement.streamId}
              streams={availableStreams}
              defaultDate={today}
            />
          </div>
        </section>
      </div>
    </main>
  );
}