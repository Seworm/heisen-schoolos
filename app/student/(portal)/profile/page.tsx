/* eslint-disable @next/next/no-img-element */

import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { auth } from "@/../auth";
import { db } from "@/db";
import {
  academicYears,
  classLevels,
  guardians,
  studentEnrollments,
  studentGuardians,
  studentPlacements,
  studentUserAccounts,
  students,
  streams,
} from "@/db/schema";

export default async function StudentProfilePage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/student/login");
  }

  if (session.user.accountType !== "student") {
    redirect("/dashboard");
  }

  const account = await db
    .select({
      studentId: studentUserAccounts.studentId,
    })
    .from(studentUserAccounts)
    .where(eq(studentUserAccounts.studentId, session.user.id))
    .limit(1);

  const studentId = account[0]?.studentId;

  if (!studentId) {
    redirect("/student/login");
  }

  const studentResult = await db
    .select({
      id: students.id,
      schoolId: students.schoolId,
      studentNumber: students.studentNumber,
      firstName: students.firstName,
      middleName: students.middleName,
      lastName: students.lastName,
      gender: students.gender,
      dateOfBirth: students.dateOfBirth,
      admissionDate: students.admissionDate,
      phone: students.phone,
      email: students.email,
      photoUrl: students.photoUrl,
    })
    .from(students)
    .where(eq(students.id, studentId))
    .limit(1);

  const student = studentResult[0];

  if (!student) {
    redirect("/student/login");
  }

  const placementResult = await db
    .select({
      academicYear: academicYears.name,
      classLevel: classLevels.name,
      stream: streams.name,
    })
    .from(studentEnrollments)
    .innerJoin(
      academicYears,
      eq(studentEnrollments.academicYearId, academicYears.id),
    )
    .innerJoin(
      studentPlacements,
      and(
        eq(
          studentPlacements.studentEnrollmentId,
          studentEnrollments.id,
        ),
        eq(studentPlacements.status, "active"),
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
        eq(studentEnrollments.status, "active"),
        eq(academicYears.isCurrent, true),
      ),
    )
    .limit(1);

  const placement = placementResult[0];

  const guardianResult = await db
    .select({
      firstName: guardians.firstName,
      lastName: guardians.lastName,
      phone: guardians.phone,
      email: guardians.email,
      address: guardians.address,
      relationship: studentGuardians.relationship,
      isPrimary: studentGuardians.isPrimary,
    })
    .from(studentGuardians)
    .innerJoin(
      guardians,
      eq(studentGuardians.guardianId, guardians.id),
    )
    .where(eq(studentGuardians.studentId, student.id));

  const fullName = [
    student.firstName,
    student.middleName,
    student.lastName,
  ]
    .filter(Boolean)
    .join(" ");

  const formatDate = (value: string | Date | null) => {
    if (!value) return "Not provided";

    return new Intl.DateTimeFormat("en-GH", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(value));
  };

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-slate-100 text-2xl font-semibold text-slate-500">
              {student.photoUrl ? (
                <img
                  src={student.photoUrl}
                  alt={fullName}
                  className="h-full w-full object-cover"
                />
              ) : (
                student.firstName.charAt(0).toUpperCase()
              )}
            </div>

            <div>
              <p className="text-sm font-medium text-slate-500">
                Student
              </p>
              <h2 className="mt-1 text-2xl font-semibold text-slate-950">
                {fullName}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {student.studentNumber}
              </p>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-950">
              Personal Information
            </h2>

            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <ProfileField label="First name" value={student.firstName} />
              <ProfileField
                label="Middle name"
                value={student.middleName ?? "Not provided"}
              />
              <ProfileField label="Last name" value={student.lastName} />
              <ProfileField label="Gender" value={student.gender} />
              <ProfileField
                label="Date of birth"
                value={formatDate(student.dateOfBirth)}
              />
              <ProfileField
                label="Admission date"
                value={formatDate(student.admissionDate)}
              />
              <ProfileField
                label="Phone"
                value={student.phone ?? "Not provided"}
              />
              <ProfileField
                label="Email"
                value={student.email ?? "Not provided"}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-950">
              Academic Information
            </h2>

            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <ProfileField
                label="Student number"
                value={student.studentNumber}
              />
              <ProfileField
                label="Academic year"
                value={placement?.academicYear ?? "Not assigned"}
              />
              <ProfileField
                label="Class"
                value={placement?.classLevel ?? "Not assigned"}
              />
              <ProfileField
                label="Stream"
                value={placement?.stream ?? "Not assigned"}
              />
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">
              Guardians
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Guardian information linked to your student record.
            </p>
          </div>

          {guardianResult.length === 0 ? (
            <p className="mt-6 rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
              No guardian information has been added yet.
            </p>
          ) : (
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {guardianResult.map((guardian, index) => (
                <div
                  key={`${guardian.firstName}-${guardian.lastName}-${index}`}
                  className="rounded-xl border border-slate-200 p-5"
                >
                  <div className="flex items-center justify-between gap-4">
                    <h3 className="font-semibold text-slate-950">
                      {guardian.firstName} {guardian.lastName}
                    </h3>

                    {guardian.isPrimary ? (
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                        Primary
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-4 space-y-2 text-sm text-slate-600">
                    <p>
                      <span className="font-medium text-slate-700">
                        Relationship:
                      </span>{" "}
                      {guardian.relationship ?? "Not provided"}
                    </p>

                    <p>
                      <span className="font-medium text-slate-700">
                        Phone:
                      </span>{" "}
                      {guardian.phone ?? "Not provided"}
                    </p>

                    <p>
                      <span className="font-medium text-slate-700">
                        Email:
                      </span>{" "}
                      {guardian.email ?? "Not provided"}
                    </p>

                    <p>
                      <span className="font-medium text-slate-700">
                        Address:
                      </span>{" "}
                      {guardian.address ?? "Not provided"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function ProfileField({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium text-slate-800">
        {value}
      </p>
    </div>
  );
}








