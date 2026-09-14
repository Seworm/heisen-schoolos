"use server";

import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { db } from "@/db";
import {
  classLevels,
} from "@/db/schema";
import { requireCurrentSchool } from "@/lib/current-school";

type FormState = {
  error?: string;
};

const validCategories = [
  "creche",
  "nursery",
  "kg",
  "primary",
  "jhs",
] as const;

export async function updateClassLevel(
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

  const category = String(
    formData.get("category") ?? "",
  ).trim();

  const sortOrderValue = String(
    formData.get("sortOrder") ?? "",
  ).trim();

  if (!id) {
    return {
      error: "Class ID is required.",
    };
  }

  if (!name) {
    return {
      error: "Class name is required.",
    };
  }

  if (
    !validCategories.includes(
      category as (typeof validCategories)[number],
    )
  ) {
    return {
      error: "Invalid class category.",
    };
  }

  const sortOrder = Number(sortOrderValue);

  if (
    !Number.isInteger(sortOrder) ||
    sortOrder < 0
  ) {
    return {
      error:
        "Sort order must be a whole number greater than or equal to zero.",
    };
  }

  const [existingClass] = await db
    .select({
      id: classLevels.id,
    })
    .from(classLevels)
    .where(
      and(
        eq(classLevels.id, id),
        eq(classLevels.schoolId, school.id),
      ),
    )
    .limit(1);

  if (!existingClass) {
    return {
      error: "Class level was not found.",
    };
  }

  const [duplicate] = await db
    .select({
      id: classLevels.id,
    })
    .from(classLevels)
    .where(
      and(
        eq(classLevels.schoolId, school.id),
        eq(classLevels.name, name),
      ),
    )
    .limit(1);

  if (duplicate && duplicate.id !== id) {
    return {
      error:
        "A class with this name already exists.",
    };
  }

  try {
    await db
      .update(classLevels)
      .set({
        name,
        category:
          category as (typeof validCategories)[number],
        sortOrder,
      })
      .where(
        and(
          eq(classLevels.id, id),
          eq(classLevels.schoolId, school.id),
        ),
      );
  } catch (error) {
    console.error(
      "Failed to update class level:",
      error,
    );

    return {
      error:
        "The class could not be updated. Please try again.",
    };
  }

  redirect(`/academics/classes/${id}`);
}