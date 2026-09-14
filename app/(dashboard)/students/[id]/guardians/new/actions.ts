"use server";

import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { db } from "@/db";
import {
  guardians,
  studentGuardians,
  students,
} from "@/db/schema";
import { requireCurrentSchool } from "@/lib/current-school";

type GuardianFormState = {
  error?: string;
};

export async function createGuardian(
  _state: GuardianFormState,
  formData: FormData,
): Promise<GuardianFormState> {
  const studentId = String(
    formData.get("studentId") ?? "",
  ).trim();

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
    !studentId ||
    !firstName ||
    !lastName ||
    !relationship ||
    !phone
  ) {
    return {
      error:
        "First name, last name, relationship and phone number are required.",
    };
  }

  try {
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

    if (isPrimary) {
      const [existingPrimary] = await db
        .select({
          guardianId: studentGuardians.guardianId,
        })
        .from(studentGuardians)
        .where(
          and(
            eq(studentGuardians.studentId, student.id),
            eq(studentGuardians.isPrimary, true),
          ),
        )
        .limit(1);

      if (existingPrimary) {
        return {
          error:
            "This student already has a primary guardian. Set the new guardian as primary after adding them, or remove the existing primary designation first.",
        };
      }
    }

    const result = await db.transaction(async (tx) => {
      const [guardian] = await tx
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
        throw new Error(
          "Guardian could not be created.",
        );
      }

      await tx.insert(studentGuardians).values({
        studentId: student.id,
        guardianId: guardian.id,
        relationship,
        isPrimary,
      });

      return guardian;
    });

    if (!result) {
      return {
        error: "Guardian could not be created.",
      };
    }
  } catch (error) {
    console.error(
      "Failed to create guardian:",
      error,
    );

    return {
      error:
        "The guardian could not be added. No changes were saved.",
    };
  }

  redirect(`/students/${studentId}`);
}