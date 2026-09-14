"use server";

import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { db } from "@/db";
import { academicYears } from "@/db/schema";
import { requireCurrentSchool } from "@/lib/current-school";

type FormState = {
  error?: string;
};

export async function createAcademicYear(
  _previousState: FormState,
  formData: FormData,
): Promise<FormState> {
  const school = await requireCurrentSchool();

  const name = String(
    formData.get("name") ?? "",
  ).trim();

  const startDate = String(
    formData.get("startDate") ?? "",
  ).trim();

  const endDate = String(
    formData.get("endDate") ?? "",
  ).trim();

  const isCurrent =
    formData.get("isCurrent") === "true";

  if (!name) {
    return {
      error: "Academic year name is required.",
    };
  }

  if (!startDate || !endDate) {
    return {
      error: "Start date and end date are required.",
    };
  }

  if (startDate >= endDate) {
    return {
      error: "The end date must be after the start date.",
    };
  }

  const [existingYear] = await db
    .select({
      id: academicYears.id,
    })
    .from(academicYears)
    .where(
      and(
        eq(academicYears.schoolId, school.id),
        eq(academicYears.name, name),
      ),
    )
    .limit(1);

  if (existingYear) {
    return {
      error:
        "This academic year already exists in this school.",
    };
  }

  try {
    await db.transaction(async (tx) => {
      if (isCurrent) {
        await tx
          .update(academicYears)
          .set({
            isCurrent: false,
          })
          .where(
            eq(
              academicYears.schoolId,
              school.id,
            ),
          );
      }

      await tx.insert(academicYears).values({
        schoolId: school.id,
        name,
        startDate,
        endDate,
        isCurrent,
      });
    });
  } catch (error) {
    console.error(
      "Failed to create academic year:",
      error,
    );

    return {
      error:
        "The academic year could not be created. Please try again.",
    };
  }

  redirect("/academics/years");
}