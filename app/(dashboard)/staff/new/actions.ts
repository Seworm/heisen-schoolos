"use server";

import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { db } from "@/db";
import { staff } from "@/db/schema";
import { requireCurrentSchool } from "@/lib/current-school";

type FormState = {
  error?: string;
  fieldErrors?: {
    firstName?: string;
    lastName?: string;
    staffNumber?: string;
    email?: string;
  };
};

export async function createStaff(
  _previousState: FormState,
  formData: FormData,
): Promise<FormState> {
  const school = await requireCurrentSchool();

  const firstName = String(formData.get("firstName") ?? "").trim();

  const middleName = String(formData.get("middleName") ?? "").trim();

  const lastName = String(formData.get("lastName") ?? "").trim();

  const staffNumber = String(
    formData.get("staffNumber") ?? "",
  )
    .trim()
    .toUpperCase();

  const genderValue = String(
    formData.get("gender") ?? "",
  ).trim();

  const dateOfBirth = String(
    formData.get("dateOfBirth") ?? "",
  ).trim();

  const phone = String(
    formData.get("phone") ?? "",
  ).trim();

  const email = String(
    formData.get("email") ?? "",
  )
    .trim()
    .toLowerCase();

  const employmentDate = String(
    formData.get("employmentDate") ?? "",
  ).trim();

  const position = String(
    formData.get("position") ?? "",
  ).trim();

  const statusValue = String(
    formData.get("status") ?? "active",
  ).trim();

  const fieldErrors: FormState["fieldErrors"] = {};

  if (!firstName) {
    fieldErrors.firstName = "First name is required.";
  }

  if (!lastName) {
    fieldErrors.lastName = "Last name is required.";
  }

  if (!staffNumber) {
    fieldErrors.staffNumber = "Staff number is required.";
  }

  if (
    email &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ) {
    fieldErrors.email = "Enter a valid email address.";
  }

  if (
    genderValue &&
    genderValue !== "male" &&
    genderValue !== "female"
  ) {
    return {
      error: "Invalid gender selected.",
      fieldErrors,
    };
  }

  if (
    statusValue !== "active" &&
    statusValue !== "inactive"
  ) {
    return {
      error: "Invalid staff status selected.",
      fieldErrors,
    };
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      fieldErrors,
    };
  }

  const [existingStaff] = await db
    .select({
      id: staff.id,
    })
    .from(staff)
    .where(
      and(
        eq(staff.schoolId, school.id),
        eq(staff.staffNumber, staffNumber),
      ),
    )
    .limit(1);

  if (existingStaff) {
    return {
      error: `Staff number ${staffNumber} is already registered in this school.`,
      fieldErrors: {
        staffNumber: "This staff number is already in use.",
      },
    };
  }

  let createdStaff: { id: string } | undefined;

  try {
    const [result] = await db
      .insert(staff)
      .values({
        schoolId: school.id,
        firstName,
        middleName: middleName || null,
        lastName,
        staffNumber,

        gender:
          genderValue === "male" ||
          genderValue === "female"
            ? genderValue
            : null,

        dateOfBirth: dateOfBirth || null,

        phone: phone || null,

        email: email || null,

        employmentDate:
          employmentDate || null,

        position: position || null,

        status:
          statusValue === "inactive"
            ? "inactive"
            : "active",
      })
      .returning({
        id: staff.id,
      });

    createdStaff = result;
  } catch (error) {
    console.error("Failed to create staff:", error);

    return {
      error:
        "The staff member could not be created. Please try again.",
    };
  }

  if (!createdStaff) {
    return {
      error: "The staff member could not be created.",
    };
  }

  redirect(`/staff/${createdStaff.id}`);
}