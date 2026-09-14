"use server";

import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { db } from "@/db";
import { academicYears } from "@/db/schema";
import { requireCurrentSchool } from "@/lib/current-school";

export type AcademicYearFormState = {
  error?: string;
};

export async function updateAcademicYear(
  _previousState: AcademicYearFormState,
  formData: FormData,
): Promise<AcademicYearFormState> {
  const school = await requireCurrentSchool();

  const academicYearId = String(
    formData.get("academicYearId") ?? "",
  ).trim();

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

  if (!academicYearId) {
    return {
      error: "Academic year is required.",
    };
  }

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

  const [year] = await db
    .select()
    .from(academicYears)
    .where(
      and(
        eq(academicYears.id, academicYearId),
        eq(academicYears.schoolId, school.id),
      ),
    )
    .limit(1);

  if (!year) {
    return {
      error: "Academic year was not found.",
    };
  }

  const [duplicateName] = await db
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

  if (
    duplicateName &&
    duplicateName.id !== year.id
  ) {
    return {
      error:
        "An academic year with this name already exists.",
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

      await tx
        .update(academicYears)
        .set({
          name,
          startDate,
          endDate,
          isCurrent,
        })
        .where(eq(academicYears.id, year.id));
    });
  } catch (error) {
    console.error(
      "Failed to update academic year:",
      error,
    );

    return {
      error:
        "The academic year could not be updated. Please try again.",
    };
  }

  redirect(
    `/academics/years/${year.id}`,
  );
}