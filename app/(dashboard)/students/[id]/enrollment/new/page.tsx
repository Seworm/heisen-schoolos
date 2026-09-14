import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { and, asc, count, eq, sql } from "drizzle-orm";

import { db } from "@/db";
import {
  academicYears,
  classLevels,
  streams,
  studentEnrollments,
  studentPlacements,
  students,
} from "@/db/schema";
import { requireCurrentSchool } from "@/lib/current-school";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

async function createEnrollment(formData: FormData) {
  "use server";

  const school = await requireCurrentSchool();

  const studentId = String(
    formData.get("studentId") ?? "",
  ).trim();

  const academicYearId = String(
    formData.get("academicYearId") ?? "",
  ).trim();

  const streamId = String(
    formData.get("streamId") ?? "",
  ).trim();

  const admissionNumber = String(
    formData.get("admissionNumber") ?? "",
  )
    .trim()
    .toUpperCase();

  const enrollmentDate = String(
    formData.get("enrollmentDate") ?? "",
  ).trim();

  if (
    !studentId ||
    !academicYearId ||
    !streamId ||
    !enrollmentDate
  ) {
    throw new Error(
      "Academic year, class/stream and enrollment date are required.",
    );
  }

  /*
   * Verify that the student belongs to the current school.
   */
  const [student] = await db
    .select({
      id: students.id,
    })
    .from(students)
    .where(
      and(
        eq(students.id, studentId),
        eq(students.schoolId, school.id),
      ),
    )
    .limit(1);

  if (!student) {
    throw new Error("Student not found.");
  }

  /*
   * Verify that the academic year belongs to this school.
   */
  const [academicYear] = await db
    .select({
      id: academicYears.id,
      name: academicYears.name,
    })
    .from(academicYears)
    .where(
      and(
        eq(academicYears.id, academicYearId),
        eq(academicYears.schoolId, school.id),
      ),
    )
    .limit(1);

  if (!academicYear) {
    throw new Error("Invalid academic year.");
  }

  /*
   * Verify that the selected stream belongs to a class
   * belonging to the current school.
   */
  const [selectedStream] = await db
    .select({
      id: streams.id,
      classLevelId: streams.classLevelId,
      className: classLevels.name,
      streamName: streams.name,
      capacity: streams.capacity,
    })
    .from(streams)
    .innerJoin(
      classLevels,
      eq(streams.classLevelId, classLevels.id),
    )
    .where(
      and(
        eq(streams.id, streamId),
        eq(classLevels.schoolId, school.id),
      ),
    )
    .limit(1);

  if (!selectedStream) {
    throw new Error("Invalid class or stream.");
  }

  /*
   * Perform the duplicate check, capacity check and inserts
   * inside one transaction.
   *
   * The advisory lock serializes enrollment attempts for
   * this specific academic-year/stream combination.
   */
  await db.transaction(async (tx) => {
    await tx.execute(
      sql`
        SELECT pg_advisory_xact_lock(
          hashtext(
            ${`heisen-schoolos:enrollment:${academicYear.id}:${selectedStream.id}`}
          )
        )
      `,
    );

    /*
     * Prevent duplicate enrollment for the same student
     * and academic year.
     */
    const [existingEnrollment] = await tx
      .select({
        id: studentEnrollments.id,
      })
      .from(studentEnrollments)
      .where(
        and(
          eq(
            studentEnrollments.studentId,
            student.id,
          ),
          eq(
            studentEnrollments.academicYearId,
            academicYear.id,
          ),
        ),
      )
      .limit(1);

    if (existingEnrollment) {
      throw new Error(
        `This student already has an enrollment for ${academicYear.name}.`,
      );
    }

    /*
     * Count students currently placed in this stream.
     *
     * IMPORTANT:
     * Capacity is now based on active student placements,
     * not the legacy student_enrollments.stream_id field.
     */
    const [placementCount] = await tx
      .select({
        count: count(),
      })
      .from(studentPlacements)
      .innerJoin(
        studentEnrollments,
        eq(
          studentPlacements.studentEnrollmentId,
          studentEnrollments.id,
        ),
      )
      .where(
        and(
          eq(
            studentEnrollments.academicYearId,
            academicYear.id,
          ),
          eq(
            studentPlacements.streamId,
            selectedStream.id,
          ),
          eq(
            studentPlacements.status,
            "active",
          ),
        ),
      );

    const currentPlacementCount =
      Number(placementCount?.count ?? 0);

    const capacity = selectedStream.capacity;

    /*
     * A null capacity means the stream has no configured
     * capacity limit.
     */
    if (
      capacity !== null &&
      currentPlacementCount >= capacity
    ) {
      throw new Error(
        `${selectedStream.className} ${selectedStream.streamName} is full. Capacity is ${capacity} students.`,
      );
    }

    /*
     * Create the academic-year enrollment.
     *
     * streamId is intentionally still populated because it
     * remains a legacy transitional column during migration.
     */
    const [enrollment] = await tx
      .insert(studentEnrollments)
      .values({
        studentId: student.id,
        academicYearId: academicYear.id,
        streamId: selectedStream.id,
        admissionNumber:
          admissionNumber || null,
        enrollmentDate,
        status: "active",
      })
      .returning({
        id: studentEnrollments.id,
      });

    if (!enrollment) {
      throw new Error(
        "Enrollment could not be created.",
      );
    }

    /*
     * Create the initial placement.
     *
     * This becomes the new source of truth for the student's
     * current class and stream.
     */
    await tx.insert(studentPlacements).values({
      studentEnrollmentId: enrollment.id,
      streamId: selectedStream.id,
      startDate: enrollmentDate,
      status: "active",
    });
  });

  redirect(`/students/${student.id}`);
}

export default async function NewEnrollmentPage({
  params,
}: PageProps) {
  const { id } = await params;

  const school = await requireCurrentSchool();

  /*
   * Load student.
   */
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
   * Load academic years for this school.
   */
  const years = await db
    .select({
      id: academicYears.id,
      name: academicYears.name,
      startDate: academicYears.startDate,
      endDate: academicYears.endDate,
      isCurrent: academicYears.isCurrent,
    })
    .from(academicYears)
    .where(eq(academicYears.schoolId, school.id))
    .orderBy(
      asc(academicYears.startDate),
    );

  /*
   * Load classes and streams.
   */
  const classRows = await db
    .select({
      classId: classLevels.id,
      className: classLevels.name,
      classCategory: classLevels.category,
      sortOrder: classLevels.sortOrder,
      streamId: streams.id,
      streamName: streams.name,
      capacity: streams.capacity,
    })
    .from(classLevels)
    .innerJoin(
      streams,
      eq(
        streams.classLevelId,
        classLevels.id,
      ),
    )
    .where(
      eq(classLevels.schoolId, school.id),
    )
    .orderBy(
      asc(classLevels.sortOrder),
      asc(streams.name),
    );

  const currentYear = years.find(
    (year) => year.isCurrent,
  );

  const today = new Date()
    .toISOString()
    .slice(0, 10);

  return (
    <div className="mx-auto max-w-4xl px-6 py-8 lg:px-8">
      <div className="mb-8">
        <Link
          href={`/students/${student.id}`}
          className="text-sm font-medium text-slate-500 transition hover:text-slate-900"
        >
          ← Back to student
        </Link>

        <div className="mt-5">
          <p className="text-sm font-medium text-slate-500">
            Student Profile
          </p>

          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">
            Assign Enrollment
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Assign {student.firstName}{" "}
            {student.lastName} to an academic year,
            class and stream.
          </p>
        </div>
      </div>

      <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Student
            </p>

            <h2 className="mt-1 text-lg font-semibold text-slate-950">
              {student.firstName}{" "}
              {student.lastName}
            </h2>
          </div>

          <span className="w-fit rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
            {student.studentNumber}
          </span>
        </div>
      </div>

      <form
        action={createEnrollment}
        className="rounded-2xl border border-slate-200 bg-white shadow-sm"
      >
        <input
          type="hidden"
          name="studentId"
          value={student.id}
        />

        <div className="border-b border-slate-200 px-6 py-5">
          <h2 className="text-base font-semibold text-slate-950">
            Enrollment Details
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Select the academic context for this
            student.
          </p>
        </div>

        <div className="grid gap-6 p-6 md:grid-cols-2">
          <div>
            <label
              htmlFor="academicYearId"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Academic Year
            </label>

            <select
              id="academicYearId"
              name="academicYearId"
              required
              defaultValue={currentYear?.id ?? ""}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            >
              <option value="">
                Select academic year
              </option>

              {years.map((year) => (
                <option
                  key={year.id}
                  value={year.id}
                >
                  {year.name}
                  {year.isCurrent
                    ? " — Current"
                    : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="enrollmentDate"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Enrollment Date
            </label>

            <input
              id="enrollmentDate"
              name="enrollmentDate"
              type="date"
              required
              defaultValue={today}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            />
          </div>

          <div>
            <label
              htmlFor="streamId"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Class & Stream
            </label>

            <select
              id="streamId"
              name="streamId"
              required
              defaultValue=""
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            >
              <option value="">
                Select class and stream
              </option>

              {classRows.map((row) => (
                <option
                  key={row.streamId}
                  value={row.streamId}
                >
                  {row.className} —{" "}
                  {row.streamName}
                  {row.capacity
                    ? ` (${row.capacity})`
                    : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="admissionNumber"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Admission Number
              <span className="ml-1 font-normal text-slate-400">
                Optional
              </span>
            </label>

            <input
              id="admissionNumber"
              name="admissionNumber"
              type="text"
              placeholder="e.g. HDS/2026/001"
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm uppercase text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            />
          </div>
        </div>

        <div className="border-t border-slate-200 bg-slate-50 px-6 py-5">
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Link
              href={`/students/${student.id}`}
              className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-center text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            >
              Cancel
            </Link>

            <button
              type="submit"
              className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Create Enrollment
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}