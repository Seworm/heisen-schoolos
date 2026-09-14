"use server";

import { and, eq, ne } from "drizzle-orm";
import { redirect } from "next/navigation";

import { db } from "@/db";
import { subjects } from "@/db/schema";
import { requireCurrentSchool } from "@/lib/current-school";

type FormState = {
  error?: string;
};

export async function updateSubject(
  _previousState: FormState,
  formData: FormData,
): Promise<FormState> {
  const school = await requireCurrentSchool();

  const id = String(
    formData.get("id") ?? "",
  ).trim();

  const name = String(
    formData.get("name") ?? "",
  ).trim();

  const codeValue = String(
    formData.get("code") ?? "",
  ).trim();

  const code = codeValue
    ? codeValue.toUpperCase()
    : null;

  if (!id) {
    return {
      error: "Subject ID is missing.",
    };
  }

  if (!name) {
    return {
      error: "Subject name is required.",
    };
  }

  if (name.length > 150) {
    return {
      error:
        "Subject name must not exceed 150 characters.",
    };
  }

  if (code && code.length > 50) {
    return {
      error:
        "Subject code must not exceed 50 characters.",
    };
  }

  const [existingSubject] = await db
    .select({
      id: subjects.id,
    })
    .from(subjects)
    .where(
      and(
        eq(subjects.id, id),
        eq(subjects.schoolId, school.id),
      ),
    )
    .limit(1);

  if (!existingSubject) {
    return {
      error: "Subject not found.",
    };
  }

  const [duplicateSubject] = await db
    .select({
      id: subjects.id,
    })
    .from(subjects)
    .where(
      and(
        eq(subjects.schoolId, school.id),
        eq(subjects.name, name),
        ne(subjects.id, id),
      ),
    )
    .limit(1);

  if (duplicateSubject) {
    return {
      error:
        "Another subject with this name already exists.",
    };
  }

  try {
    await db
      .update(subjects)
      .set({
        name,
        code,
      })
      .where(
        and(
          eq(subjects.id, id),
          eq(subjects.schoolId, school.id),
        ),
      );
  } catch (error) {
    console.error(
      "Failed to update subject:",
      error,
    );

    return {
      error:
        "The subject could not be updated. Please try again.",
    };
  }

  redirect("/academics/subjects");
}