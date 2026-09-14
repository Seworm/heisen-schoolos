import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import {
  guardians,
  studentGuardians,
  students,
} from "@/db/schema";
import { requireCurrentSchool } from "@/lib/current-school";

export const dynamic = "force-dynamic";

type EditGuardianPageProps = {
  params: Promise<{
    id: string;
    guardianId: string;
  }>;
};

async function updateGuardian(formData: FormData) {
  "use server";

  const studentId = String(
    formData.get("studentId") ?? "",
  ).trim();

  const guardianId = String(
    formData.get("guardianId") ?? "",
  ).trim();

  const school = await requireCurrentSchool();

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

  const [guardian] = await db
    .select({
      id: guardians.id,
    })
    .from(guardians)
    .innerJoin(
      studentGuardians,
      eq(
        studentGuardians.guardianId,
        guardians.id,
      ),
    )
    .where(
      and(
        eq(guardians.id, guardianId),
        eq(guardians.schoolId, school.id),
        eq(
          studentGuardians.studentId,
          student.id,
        ),
      ),
    )
    .limit(1);

  if (!guardian) {
    throw new Error(
      "Guardian is not associated with this student.",
    );
  }

  const firstName = String(
    formData.get("firstName") ?? "",
  ).trim();

  const lastName = String(
    formData.get("lastName") ?? "",
  ).trim();

  const relationship = String(
    formData.get("relationship") ?? "",
  ).trim();

  const phone = String(
    formData.get("phone") ?? "",
  ).trim();

  const email = String(
    formData.get("email") ?? "",
  ).trim();

  const address = String(
    formData.get("address") ?? "",
  ).trim();

  if (
    !firstName ||
    !lastName ||
    !relationship ||
    !phone
  ) {
    throw new Error(
      "First name, last name, relationship and phone are required.",
    );
  }

  // Update guardian's personal/contact information.
  // Relationship is stored in student_guardians.
  await db
    .update(guardians)
    .set({
      firstName,
      lastName,
      phone,
      email: email || null,
      address: address || null,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(guardians.id, guardian.id),
        eq(guardians.schoolId, school.id),
      ),
    );

  // Update the relationship for this specific
  // student ↔ guardian relationship.
  await db
    .update(studentGuardians)
    .set({
      relationship,
    })
    .where(
      and(
        eq(studentGuardians.studentId, student.id),
        eq(
          studentGuardians.guardianId,
          guardian.id,
        ),
      ),
    );

  redirect(`/students/${student.id}`);
}

export default async function EditGuardianPage({
  params,
}: EditGuardianPageProps) {
  const { id, guardianId } = await params;

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

  // Relationship comes from student_guardians,
  // not guardians.
  const [guardian] = await db
    .select({
      id: guardians.id,
      firstName: guardians.firstName,
      lastName: guardians.lastName,
      relationship: studentGuardians.relationship,
      phone: guardians.phone,
      email: guardians.email,
      address: guardians.address,
    })
    .from(guardians)
    .innerJoin(
      studentGuardians,
      eq(
        studentGuardians.guardianId,
        guardians.id,
      ),
    )
    .where(
      and(
        eq(guardians.id, guardianId),
        eq(guardians.schoolId, school.id),
        eq(
          studentGuardians.studentId,
          student.id,
        ),
      ),
    )
    .limit(1);

  if (!guardian) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-8 lg:px-8">
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
            Edit Guardian
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Update guardian information for{" "}
            {student.firstName} {student.lastName}.
          </p>
        </div>
      </div>

      <div className="mb-6 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
          Student
        </p>

        <div className="mt-1 flex flex-wrap items-center gap-2">
          <p className="text-sm font-semibold text-slate-900">
            {student.firstName} {student.lastName}
          </p>

          <span className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200">
            {student.studentNumber}
          </span>
        </div>
      </div>

      <form
        action={updateGuardian}
        className="rounded-xl border border-slate-200 bg-white shadow-sm"
      >
        <input
          type="hidden"
          name="studentId"
          value={student.id}
        />

        <input
          type="hidden"
          name="guardianId"
          value={guardian.id}
        />

        <div className="border-b border-slate-200 px-6 py-5">
          <h2 className="text-base font-semibold text-slate-950">
            Guardian Information
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Update the guardian&apos;s contact and relationship details.
          </p>
        </div>

        <div className="space-y-6 px-6 py-6">
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label
                htmlFor="firstName"
                className="block text-sm font-medium text-slate-700"
              >
                First name
              </label>

              <input
                id="firstName"
                name="firstName"
                required
                defaultValue={guardian.firstName}
                className="mt-2 block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              />
            </div>

            <div>
              <label
                htmlFor="lastName"
                className="block text-sm font-medium text-slate-700"
              >
                Last name
              </label>

              <input
                id="lastName"
                name="lastName"
                required
                defaultValue={guardian.lastName}
                className="mt-2 block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              />
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label
                htmlFor="relationship"
                className="block text-sm font-medium text-slate-700"
              >
                Relationship
              </label>

              <select
                id="relationship"
                name="relationship"
                required
                defaultValue={guardian.relationship ?? ""}
                className="mt-2 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              >
                <option value="">
                  Select relationship
                </option>
                <option value="Father">Father</option>
                <option value="Mother">Mother</option>
                <option value="Guardian">Guardian</option>
                <option value="Grandfather">
                  Grandfather
                </option>
                <option value="Grandmother">
                  Grandmother
                </option>
                <option value="Uncle">Uncle</option>
                <option value="Aunt">Aunt</option>
                <option value="Sibling">Sibling</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-slate-700"
              >
                Phone number
              </label>

              <input
                id="phone"
                name="phone"
                type="tel"
                required
                defaultValue={guardian.phone ?? ""}
                className="mt-2 block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-slate-700"
            >
              Email address
            </label>

            <input
              id="email"
              name="email"
              type="email"
              defaultValue={guardian.email ?? ""}
              className="mt-2 block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            />
          </div>

          <div>
            <label
              htmlFor="address"
              className="block text-sm font-medium text-slate-700"
            >
              Address
            </label>

            <textarea
              id="address"
              name="address"
              rows={3}
              defaultValue={guardian.address ?? ""}
              className="mt-2 block w-full resize-none rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            />
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4 sm:flex-row sm:justify-end">
          <Link
            href={`/students/${student.id}`}
            className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </Link>

          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
          >
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
}