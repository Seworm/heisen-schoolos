"use server";

import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { students } from "@/db/schema";
import { requireCurrentSchool } from "@/lib/current-school";
import { provisionStudentAccount } from "@/lib/students/provision-account";

export type CreateStudentResult =
  | {
      success: true;
      credentials: {
        studentNumber: string;
        temporaryPassword: string;
      };
    }
  | {
      success: false;
      error: string;
    };

export async function createStudent(
  formData: FormData,
): Promise<CreateStudentResult> {
  try {
    const school = await requireCurrentSchool();

    const firstName = String(formData.get("firstName") ?? "").trim();
    const middleName = String(formData.get("middleName") ?? "").trim();
    const lastName = String(formData.get("lastName") ?? "").trim();

    const studentNumber = String(formData.get("studentNumber") ?? "")
      .trim()
      .toUpperCase();

    const gender = String(formData.get("gender") ?? "").trim();

    const dateOfBirth = String(formData.get("dateOfBirth") ?? "").trim();
    const admissionDate = String(formData.get("admissionDate") ?? "").trim();
    const phone = String(formData.get("phone") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();

    if (!firstName || !lastName || !studentNumber || !gender) {
      return {
        success: false,
        error:
          "First name, last name, student number and gender are required.",
      };
    }

    if (gender !== "male" && gender !== "female") {
      return {
        success: false,
        error: "Invalid gender.",
      };
    }

    const existingStudent = await db
      .select({ id: students.id })
      .from(students)
      .where(
        and(
          eq(students.schoolId, school.id),
          eq(students.studentNumber, studentNumber),
        ),
      )
      .limit(1);

    if (existingStudent.length > 0) {
      return {
        success: false,
        error: `Student number "${studentNumber}" already exists in this school.`,
      };
    }

    const [student] = await db
      .insert(students)
      .values({
        schoolId: school.id,
        studentNumber,
        firstName,
        middleName: middleName || null,
        lastName,
        gender,
        dateOfBirth: dateOfBirth || null,
        admissionDate: admissionDate || null,
        phone: phone || null,
        email: email || null,
      })
      .returning({
        id: students.id,
      });

    if (!student) {
      return {
        success: false,
        error: "Student could not be created.",
      };
    }

    try {
      const account = await provisionStudentAccount(student.id);

      return {
        success: true,
        credentials: {
          studentNumber: account.studentNumber,
          temporaryPassword: account.temporaryPassword,
        },
      };
    } catch (error) {
      // Remove the student record if account provisioning failed.
      await db.delete(students).where(eq(students.id, student.id));

      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Student account could not be created.",
      };
    }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Unable to create the student.",
    };
  }
}