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

import GuardianForm from "./GuardianForm";

export const dynamic = "force-dynamic";

type GuardianFormState = {
  error?: string;
};

type GuardianPageProps = {
  params: Promise<{
    id: string;
  }>;
};

async function createGuardian(
  _state: GuardianFormState,
  formData: FormData,
): Promise<GuardianFormState> {
  "use server";

  try {
    const studentId = String(
      formData.get("studentId") ?? "",
    ).trim();

    const school = await requireCurrentSchool();

    const [student] = await db
      .select({
        id: students.id,
        firstName: students.firstName,
        lastName: students.lastName,
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
      return {
        error: "Student not found.",
      };
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

    const isPrimary =
      formData.get("isPrimary") === "on";

    if (
      !firstName ||
      !lastName ||
      !relationship ||
      !phone
    ) {
      return {
        error:
          "First name, last name, relationship and phone are required.",
      };
    }

    if (isPrimary) {
      const [existingPrimary] = await db
        .select({
          guardianId: studentGuardians.guardianId,
        })
        .from(studentGuardians)
        .where(
          and(
            eq(
              studentGuardians.studentId,
              student.id,
            ),
            eq(
              studentGuardians.isPrimary,
              true,
            ),
          ),
        )
        .limit(1);

      if (existingPrimary) {
        return {
          error:
            "This student already has a primary guardian. Remove primary status from the existing guardian before assigning another.",
        };
      }
    }

    /*
     * Create the guardian's own record.
     *
     * Relationship is intentionally NOT stored here.
     * It belongs to studentGuardians because the same guardian
     * may have different relationships with different students.
     */
    const [guardian] = await db
      .insert(guardians)
      .values({
        schoolId: school.id,
        firstName,
        lastName,
        phone,
        email: email || null,
        address: address || null,
      })
      .returning({
        id: guardians.id,
      });

    if (!guardian) {
      return {
        error: "Guardian could not be created.",
      };
    }

    /*
     * Create the student ↔ guardian relationship.
     */
    try {
      await db.insert(studentGuardians).values({
        studentId: student.id,
        guardianId: guardian.id,
        relationship,
        isPrimary,
      });
    } catch (error) {
      /*
       * If linking fails, remove the newly-created guardian
       * so we don't leave an orphan record behind.
       */
      await db
        .delete(guardians)
        .where(
          and(
            eq(guardians.id, guardian.id),
            eq(
              guardians.schoolId,
              school.id,
            ),
          ),
        );

      console.error(
        "Failed to link guardian to student:",
        error,
      );

      return {
        error:
          "The guardian could not be linked to this student.",
      };
    }

    redirect(`/students/${student.id}`);
  } catch (error) {
    console.error(
      "Failed to create guardian:",
      error,
    );

    /*
     * Next.js redirect() throws internally.
     * Re-throw the redirect instead of converting it
     * into a form error.
     */
    if (
      error &&
      typeof error === "object" &&
      "digest" in error &&
      typeof error.digest === "string" &&
      error.digest.startsWith("NEXT_REDIRECT")
    ) {
      throw error;
    }

    return {
      error:
        "Something went wrong while creating the guardian. Please try again.",
    };
  }
}

export default async function NewGuardianPage({
  params,
}: GuardianPageProps) {
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

  const studentName = `${student.firstName} ${student.lastName}`;

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
            Add Guardian
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Add a parent or guardian to{" "}
            {studentName}.
          </p>
        </div>
      </div>

      <div className="mb-6 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
          Student
        </p>

        <div className="mt-1 flex flex-wrap items-center gap-2">
          <p className="text-sm font-semibold text-slate-900">
            {studentName}
          </p>

          <span className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200">
            {student.studentNumber}
          </span>
        </div>
      </div>

      <GuardianForm
        studentId={student.id}
        studentName={studentName}
        action={createGuardian}
      />
    </div>
  );
}