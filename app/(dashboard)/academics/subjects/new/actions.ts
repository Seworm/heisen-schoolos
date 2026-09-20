"use server";

import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { db } from "@/db";
import { subjects } from "@/db/schema";
import { requireCurrentSchool } from "@/lib/current-school";

type FormState = {
  error?: string;
};

export async function createSubject(
  _previousState: FormState,
  formData: FormData,
): Promise<FormState> {
  const school = await requireCurrentSchool();

  const name = String(
    formData.get("name") ?? "",
  ).trim();

  const codeValue = String(
    formData.get("code") ?? "",
  ).trim();

  const code = codeValue
    ? codeValue.toUpperCase()
    : null;

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
        eq(subjects.schoolId, school.id),
        eq(subjects.name, name),
      ),
    )
    .limit(1);

  if (existingSubject) {
    return {
      error:
        "A subject with this name already exists.",
    };
  }

  try {
    await db.insert(subjects).values({
      schoolId: school.id,
      name,
      code,
    });
  } catch (error) {
    console.error(
      "Failed to create subject:",
      error,
    );

    return {
      error:
        "The subject could not be created. Please try again.",
    };
  }

  redirect("/academics/subjects");
}

