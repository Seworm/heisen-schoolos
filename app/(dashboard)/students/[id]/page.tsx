import Link from "next/link";
import GuardianActions from "./guardians/GuardianActions";
import { notFound } from "next/navigation";
import { and, desc, eq } from "drizzle-orm";

import { db } from "@/db";
import {
  academicYears,
  classLevels,
  guardians,
  streams,
  studentEnrollments,
  studentGuardians,
  studentPlacements,
  students,
} from "@/db/schema";
import { requireCurrentSchool } from "@/lib/current-school";

export const dynamic = "force-dynamic";

type StudentPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function StudentDetailPage({
  params,
}: StudentPageProps) {
  const { id } = await params;
  const school = await requireCurrentSchool();

  const [student] = await db
    .select({
      id: students.id,
      studentNumber: students.studentNumber,
      firstName: students.firstName,
      middleName: students.middleName,
      lastName: students.lastName,
      gender: students.gender,
      dateOfBirth: students.dateOfBirth,
      admissionDate: students.admissionDate,
      phone: students.phone,
      email: students.email,
      createdAt: students.createdAt,
      updatedAt: students.updatedAt,
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
   * Guardians
   */
  const guardianRows = await db
    .select({
      id: guardians.id,
      firstName: guardians.firstName,
      lastName: guardians.lastName,
      phone: guardians.phone,
      email: guardians.email,
      relationship: studentGuardians.relationship,
      isPrimary: studentGuardians.isPrimary,
    })
    .from(studentGuardians)
    .innerJoin(
      guardians,
      eq(studentGuardians.guardianId, guardians.id),
    )
    .where(
      and(
        eq(studentGuardians.studentId, student.id),
        eq(guardians.schoolId, school.id),
      ),
    );

  /*
   * Current placement.
   *
   * The placement table is now the source of truth for the
   * student's current class and stream.
   */
  const [currentPlacement] = await db
    .select({
      placementId: studentPlacements.id,
      placementStatus: studentPlacements.status,
      placementStartDate: studentPlacements.startDate,
      placementEndDate: studentPlacements.endDate,

      enrollmentId: studentEnrollments.id,
      admissionNumber: studentEnrollments.admissionNumber,
      enrollmentDate: studentEnrollments.enrollmentDate,
      enrollmentStatus: studentEnrollments.status,

      academicYearId: academicYears.id,
      academicYearName: academicYears.name,

      streamId: streams.id,
      streamName: streams.name,
      capacity: streams.capacity,

      classLevelId: classLevels.id,
      className: classLevels.name,
      classCategory: classLevels.category,
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
      eq(
        studentPlacements.streamId,
        streams.id,
      ),
    )
    .innerJoin(
      classLevels,
      eq(
        streams.classLevelId,
        classLevels.id,
      ),
    )
    .where(
      and(
        eq(
          studentEnrollments.studentId,
          student.id,
        ),
        eq(
          studentPlacements.status,
          "active",
        ),
        eq(
          academicYears.schoolId,
          school.id,
        ),
        eq(
          classLevels.schoolId,
          school.id,
        ),
      ),
    )
    .limit(1);

  /*
   * Placement history.
   *
   * This includes the current placement and all completed/
   * transferred/cancelled placements.
   */
  const placementHistory = await db
    .select({
      placementId: studentPlacements.id,
      placementStatus: studentPlacements.status,
      startDate: studentPlacements.startDate,
      endDate: studentPlacements.endDate,

      academicYearName: academicYears.name,
      admissionNumber: studentEnrollments.admissionNumber,

      className: classLevels.name,
      classCategory: classLevels.category,

      streamName: streams.name,
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
      eq(
        studentPlacements.streamId,
        streams.id,
      ),
    )
    .innerJoin(
      classLevels,
      eq(
        streams.classLevelId,
        classLevels.id,
      ),
    )
    .where(
      and(
        eq(
          studentEnrollments.studentId,
          student.id,
        ),
        eq(
          academicYears.schoolId,
          school.id,
        ),
        eq(
          classLevels.schoolId,
          school.id,
        ),
      ),
    )
    .orderBy(
      desc(studentPlacements.startDate),
      desc(studentPlacements.createdAt),
    );

  const fullName = [
    student.firstName,
    student.middleName,
    student.lastName,
  ]
    .filter(Boolean)
    .join(" ");

  const formatDate = (value: Date | string | null) => {
    if (!value) return "—";

    return new Date(value).toLocaleDateString("en-GH", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const placementStatusLabel = (status: string) => {
    switch (status) {
      case "active":
        return "Active";

      case "completed":
        return "Completed";

      case "transferred":
        return "Transferred";

      case "cancelled":
        return "Cancelled";

      default:
        return status;
    }
  };

  const placementStatusClass = (status: string) => {
    switch (status) {
      case "active":
        return "bg-emerald-50 text-emerald-700";

      case "transferred":
        return "bg-amber-50 text-amber-700";

      case "completed":
        return "bg-slate-100 text-slate-700";

      case "cancelled":
        return "bg-red-50 text-red-700";

      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-6 py-8 lg:px-8">
      {/* Header */}
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-lg font-semibold text-white">
            {student.firstName.charAt(0)}
            {student.lastName.charAt(0)}
          </div>

          <div>
            <p className="text-sm font-medium text-slate-500">
              Student Profile
            </p>

            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">
              {fullName}
            </h1>

            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                {student.studentNumber}
              </span>

              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium capitalize text-emerald-700">
                Active
              </span>
            </div>
          </div>
        </div>

        <Link
          href="/students"
          className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          ← Back to Students
        </Link>
      </div>

      {/* School context */}
      <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
          School
        </p>

        <p className="mt-1 text-sm font-medium text-slate-900">
          {school.name}
        </p>
      </div>

      {/* Current Placement */}
      <section className="mt-6 rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-200 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-950">
              Current Placement
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              The student's current academic-year class and
              stream placement.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {!currentPlacement && (
              <Link
                href={`/students/${student.id}/enrollment/new`}
                className="inline-flex items-center justify-center rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
              >
                Assign Enrollment
              </Link>
            )}

            {currentPlacement && (
              <Link
                href={`/students/${student.id}/placement`}
                className="inline-flex items-center justify-center rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Transfer student
              </Link>
            )}
          </div>
        </div>

        {currentPlacement ? (
          <div className="grid gap-6 px-6 py-6 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Academic Year
              </p>

              <p className="mt-2 text-sm font-semibold text-slate-950">
                {currentPlacement.academicYearName}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Class
              </p>

              <p className="mt-2 text-sm font-semibold text-slate-950">
                {currentPlacement.className}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Stream
              </p>

              <p className="mt-2 text-sm font-semibold text-slate-950">
                {currentPlacement.streamName}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Capacity
              </p>

              <p className="mt-2 text-sm font-semibold text-slate-950">
                {currentPlacement.capacity ?? "No limit"}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Admission Number
              </p>

              <p className="mt-2 text-sm font-semibold text-slate-950">
                {currentPlacement.admissionNumber || "—"}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Enrollment Date
              </p>

              <p className="mt-2 text-sm font-semibold text-slate-950">
                {formatDate(
                  currentPlacement.enrollmentDate,
                )}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Placement Started
              </p>

              <p className="mt-2 text-sm font-semibold text-slate-950">
                {formatDate(
                  currentPlacement.placementStartDate,
                )}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Status
              </p>

              <span
                className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${placementStatusClass(
                  currentPlacement.placementStatus,
                )}`}
              >
                {placementStatusLabel(
                  currentPlacement.placementStatus,
                )}
              </span>
            </div>
          </div>
        ) : (
          <div className="px-6 py-10 text-center">
            <p className="text-sm font-semibold text-slate-900">
              No current enrollment
            </p>

            <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
              This student has not yet been assigned to an
              academic year, class and stream.
            </p>

            <Link
              href={`/students/${student.id}/enrollment/new`}
              className="mt-4 inline-flex items-center justify-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Assign first enrollment
            </Link>
          </div>
        )}
      </section>

      {/* Placement History */}
      <section className="mt-6 rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-5">
          <h2 className="text-base font-semibold text-slate-950">
            Placement History
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Historical record of the student's class and stream
            placements.
          </p>
        </div>

        {placementHistory.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <p className="text-sm font-semibold text-slate-900">
              No placement history
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Placement records will appear here once the student
              is enrolled.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-left">
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Academic Year
                  </th>

                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Class
                  </th>

                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Stream
                  </th>

                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Start
                  </th>

                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    End
                  </th>

                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {placementHistory.map((placement) => (
                  <tr
                    key={placement.placementId}
                    className="hover:bg-slate-50"
                  >
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">
                      {placement.academicYearName}
                    </td>

                    <td className="px-6 py-4 text-sm text-slate-700">
                      {placement.className}
                    </td>

                    <td className="px-6 py-4 text-sm text-slate-700">
                      {placement.streamName}
                    </td>

                    <td className="px-6 py-4 text-sm text-slate-600">
                      {formatDate(
                        placement.startDate,
                      )}
                    </td>

                    <td className="px-6 py-4 text-sm text-slate-600">
                      {formatDate(
                        placement.endDate,
                      )}
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${placementStatusClass(
                          placement.placementStatus,
                        )}`}
                      >
                        {placementStatusLabel(
                          placement.placementStatus,
                        )}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Information grid */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Personal information */}
        <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-5">
            <h2 className="text-base font-semibold text-slate-950">
              Personal Information
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Basic identifying information for this student.
            </p>
          </div>

          <dl className="divide-y divide-slate-100">
            <div className="grid grid-cols-2 gap-4 px-6 py-4">
              <dt className="text-sm text-slate-500">
                First name
              </dt>

              <dd className="text-right text-sm font-medium text-slate-900">
                {student.firstName}
              </dd>
            </div>

            <div className="grid grid-cols-2 gap-4 px-6 py-4">
              <dt className="text-sm text-slate-500">
                Middle name
              </dt>

              <dd className="text-right text-sm font-medium text-slate-900">
                {student.middleName || "—"}
              </dd>
            </div>

            <div className="grid grid-cols-2 gap-4 px-6 py-4">
              <dt className="text-sm text-slate-500">
                Last name
              </dt>

              <dd className="text-right text-sm font-medium text-slate-900">
                {student.lastName}
              </dd>
            </div>

            <div className="grid grid-cols-2 gap-4 px-6 py-4">
              <dt className="text-sm text-slate-500">
                Gender
              </dt>

              <dd className="text-right text-sm font-medium capitalize text-slate-900">
                {student.gender}
              </dd>
            </div>

            <div className="grid grid-cols-2 gap-4 px-6 py-4">
              <dt className="text-sm text-slate-500">
                Date of birth
              </dt>

              <dd className="text-right text-sm font-medium text-slate-900">
                {formatDate(student.dateOfBirth)}
              </dd>
            </div>
          </dl>
        </section>

        {/* Admission information */}
        <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-5">
            <h2 className="text-base font-semibold text-slate-950">
              Admission Information
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              School registration and admission details.
            </p>
          </div>

          <dl className="divide-y divide-slate-100">
            <div className="grid grid-cols-2 gap-4 px-6 py-4">
              <dt className="text-sm text-slate-500">
                Student number
              </dt>

              <dd className="text-right text-sm font-medium text-slate-900">
                {student.studentNumber}
              </dd>
            </div>

            <div className="grid grid-cols-2 gap-4 px-6 py-4">
              <dt className="text-sm text-slate-500">
                Admission date
              </dt>

              <dd className="text-right text-sm font-medium text-slate-900">
                {formatDate(student.admissionDate)}
              </dd>
            </div>

            <div className="grid grid-cols-2 gap-4 px-6 py-4">
              <dt className="text-sm text-slate-500">
                Record created
              </dt>

              <dd className="text-right text-sm font-medium text-slate-900">
                {formatDate(student.createdAt)}
              </dd>
            </div>

            <div className="grid grid-cols-2 gap-4 px-6 py-4">
              <dt className="text-sm text-slate-500">
                Last updated
              </dt>

              <dd className="text-right text-sm font-medium text-slate-900">
                {formatDate(student.updatedAt)}
              </dd>
            </div>
          </dl>
        </section>

        {/* Contact information */}
        <section className="rounded-xl border border-slate-200 bg-white shadow-sm lg:col-span-2">
          <div className="border-b border-slate-200 px-6 py-5">
            <h2 className="text-base font-semibold text-slate-950">
              Contact Information
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Contact details associated with this student.
            </p>
          </div>

          <div className="grid gap-6 px-6 py-6 md:grid-cols-2">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Phone
              </p>

              <p className="mt-2 text-sm font-medium text-slate-900">
                {student.phone ||
                  "No phone number recorded"}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Email
              </p>

              <p className="mt-2 text-sm font-medium text-slate-900">
                {student.email ||
                  "No email address recorded"}
              </p>
            </div>
          </div>
        </section>

        {/* Guardians */}
        <section className="rounded-xl border border-slate-200 bg-white shadow-sm lg:col-span-2">
          <div className="flex flex-col gap-4 border-b border-slate-200 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-950">
                Guardians
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Parents and guardians associated with this student.
              </p>
            </div>

            <Link
              href={`/students/${student.id}/guardians/new`}
              className="inline-flex items-center justify-center rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              + Add Guardian
            </Link>
          </div>

          {guardianRows.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                +
              </div>

              <p className="mt-4 text-sm font-semibold text-slate-900">
                No guardians recorded
              </p>

              <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
                Add a parent or guardian to this student's record.
              </p>

              <Link
                href={`/students/${student.id}/guardians/new`}
                className="mt-4 inline-flex items-center justify-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Add first guardian
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {guardianRows.map((guardian) => (
                <div
                  key={guardian.id}
                  className="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-700">
                      {guardian.firstName.charAt(0)}
                      {guardian.lastName.charAt(0)}
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-slate-950">
                          {guardian.firstName}{" "}
                          {guardian.lastName}
                        </p>

                        {guardian.isPrimary && (
                          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                            Primary
                          </span>
                        )}
                      </div>

                      <p className="mt-1 text-sm text-slate-500">
                        {guardian.relationship}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 sm:items-end">
                    <div className="text-sm sm:text-right">
                      <p className="font-medium text-slate-900">
                        {guardian.phone}
                      </p>

                      {guardian.email && (
                        <p className="mt-1 text-slate-500">
                          {guardian.email}
                        </p>
                      )}
                    </div>

                    <GuardianActions
                      studentId={student.id}
                      guardianId={guardian.id}
                      isPrimary={guardian.isPrimary}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Upcoming modules */}
        <section className="rounded-xl border border-dashed border-slate-300 bg-slate-50 lg:col-span-2">
          <div className="px-6 py-6">
            <p className="text-sm font-semibold text-slate-900">
              Student records
            </p>

            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
              Attendance, assessments, fees, report cards, and
              other academic records will connect to this student's
              enrollment and placement history as those modules are
              implemented.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}