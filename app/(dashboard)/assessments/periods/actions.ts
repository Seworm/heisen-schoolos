"use server";

import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { db } from "@/db";
import {
  academicYears,
  assessmentPeriods,
  terms,
} from "@/db/schema";
import { requireCurrentSchool } from "@/lib/current-school";

type ActionState = {
  error?: string;
};

function isValidDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const [year, month, day] = value
    .split("-")
    .map(Number);

  const date = new Date(
    Date.UTC(year, month - 1, day),
  );

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

export async function createAssessmentPeriod(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const academicYearId = String(
    formData.get("academicYearId") ?? "",
  ).trim();

  const termId = String(
    formData.get("termId") ?? "",
  ).trim();

  const name = String(
    formData.get("name") ?? "",
  ).trim();

  const description =
    String(
      formData.get("description") ?? "",
    ).trim() || null;

  const startDate =
    String(
      formData.get("startDate") ?? "",
    ).trim() || null;

  const endDate =
    String(
      formData.get("endDate") ?? "",
    ).trim() || null;

  if (
    !academicYearId ||
    !termId ||
    !name
  ) {
    return {
      error:
        "Academic year, term and name are required.",
    };
  }

  if (name.length > 150) {
    return {
      error:
        "Assessment period name must be 150 characters or fewer.",
    };
  }

  if (startDate && !isValidDate(startDate)) {
    return {
      error: "Start date is invalid.",
    };
  }

  if (endDate && !isValidDate(endDate)) {
    return {
      error: "End date is invalid.",
    };
  }

  if (
    startDate &&
    endDate &&
    startDate > endDate
  ) {
    return {
      error:
        "Start date cannot be after the end date.",
    };
  }

  const school =
    await requireCurrentSchool();

  const [year] = await db
    .select({
      id: academicYears.id,
      startDate: academicYears.startDate,
      endDate: academicYears.endDate,
    })
    .from(academicYears)
    .where(
      and(
        eq(
          academicYears.id,
          academicYearId,
        ),
        eq(
          academicYears.schoolId,
          school.id,
        ),
      ),
    )
    .limit(1);

  if (!year) {
    return {
      error:
        "The selected academic year is invalid.",
    };
  }

  const [term] = await db
    .select({
      id: terms.id,
      startDate: terms.startDate,
      endDate: terms.endDate,
    })
    .from(terms)
    .where(
      and(
        eq(terms.id, termId),
        eq(
          terms.academicYearId,
          academicYearId,
        ),
      ),
    )
    .limit(1);

  if (!term) {
    return {
      error:
        "The selected term is invalid.",
    };
  }

  if (
    startDate &&
    year.startDate &&
    startDate < year.startDate
  ) {
    return {
      error:
        "Start date cannot be before the academic year starts.",
    };
  }

  if (
    endDate &&
    year.endDate &&
    endDate > year.endDate
  ) {
    return {
      error:
        "End date cannot be after the academic year ends.",
    };
  }

  if (
    startDate &&
    term.startDate &&
    startDate < term.startDate
  ) {
    return {
      error:
        "Start date cannot be before the selected term starts.",
    };
  }

  if (
    endDate &&
    term.endDate &&
    endDate > term.endDate
  ) {
    return {
      error:
        "End date cannot be after the selected term ends.",
    };
  }

  try {
    await db
      .insert(assessmentPeriods)
      .values({
        schoolId: school.id,
        academicYearId,
        termId,
        name,
        description,
        startDate,
        endDate,
        status: "draft",
      });
  } catch (error) {
    console.error(
      "Failed to create assessment period:",
      error,
    );

    return {
      error:
        "Assessment period could not be created. Check that it does not already exist.",
    };
  }

  redirect("/assessments/periods");
}