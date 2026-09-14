"use server";

import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { db } from "@/db";
import { academicYears, terms } from "@/db/schema";
import { requireCurrentSchool } from "@/lib/current-school";

export type TermFormState = {
  error?: string;
};

export async function updateTerm(
  _previousState: TermFormState,
  formData: FormData,
): Promise<TermFormState> {
  const school = await requireCurrentSchool();

  const academicYearId = String(
    formData.get("academicYearId") ?? "",
  ).trim();

  const termId = String(
    formData.get("termId") ?? "",
  ).trim();

  const name = String(
    formData.get("name") ?? "",
  ).trim();

  const termNumber = Number(
    formData.get("termNumber"),
  );

  const startDate = String(
    formData.get("startDate") ?? "",
  ).trim();

  const endDate = String(
    formData.get("endDate") ?? "",
  ).trim();

  const isCurrent =
    formData.get("isCurrent") === "true";

  if (!academicYearId || !termId) {
    return {
      error: "Invalid term request.",
    };
  }

  if (!name) {
    return {
      error: "Term name is required.",
    };
  }

  if (![1, 2, 3].includes(termNumber)) {
    return {
      error: "Term number must be 1, 2, or 3.",
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

  const [academicYear] = await db
    .select()
    .from(academicYears)
    .where(
      and(
        eq(academicYears.id, academicYearId),
        eq(academicYears.schoolId, school.id),
      ),
    )
    .limit(1);

  if (!academicYear) {
    return {
      error: "Academic year was not found.",
    };
  }

  const [existingTerm] = await db
    .select()
    .from(terms)
    .where(
      and(
        eq(terms.id, termId),
        eq(terms.academicYearId, academicYear.id),
      ),
    )
    .limit(1);

  if (!existingTerm) {
    return {
      error: "Term was not found.",
    };
  }

  if (
    startDate < academicYear.startDate ||
    endDate > academicYear.endDate
  ) {
    return {
      error:
        "Term dates must fall within the academic year.",
    };
  }

  const [duplicateNumber] = await db
    .select({
      id: terms.id,
    })
    .from(terms)
    .where(
      and(
        eq(terms.academicYearId, academicYear.id),
        eq(terms.termNumber, termNumber),
      ),
    )
    .limit(1);

  if (
    duplicateNumber &&
    duplicateNumber.id !== existingTerm.id
  ) {
    return {
      error:
        "This term number already exists for this academic year.",
    };
  }

  const [duplicateName] = await db
    .select({
      id: terms.id,
    })
    .from(terms)
    .where(
      and(
        eq(terms.academicYearId, academicYear.id),
        eq(terms.name, name),
      ),
    )
    .limit(1);

  if (
    duplicateName &&
    duplicateName.id !== existingTerm.id
  ) {
    return {
      error:
        "A term with this name already exists for this academic year.",
    };
  }

  try {
    await db.transaction(async (tx) => {
      if (isCurrent) {
        await tx
          .update(terms)
          .set({
            isCurrent: false,
          })
          .where(
            eq(
              terms.academicYearId,
              academicYear.id,
            ),
          );
      }

      await tx
        .update(terms)
        .set({
          name,
          termNumber,
          startDate,
          endDate,
          isCurrent,
        })
        .where(eq(terms.id, existingTerm.id));
    });
  } catch (error) {
    console.error(
      "Failed to update term:",
      error,
    );

    return {
      error:
        "The term could not be updated. Please try again.",
    };
  }

  redirect(
    `/academics/years/${academicYear.id}`,
  );
}