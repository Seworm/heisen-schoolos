"use server";

import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { db } from "@/db";
import { academicYears, terms } from "@/db/schema";
import { requireCurrentSchool } from "@/lib/current-school";

export type TermFormState = {
  error?: string;
};

export async function createTerm(
  _previousState: TermFormState,
  formData: FormData,
): Promise<TermFormState> {
  const school = await requireCurrentSchool();

  const academicYearId = String(
    formData.get("academicYearId") ?? "",
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

  if (!academicYearId) {
    return {
      error: "Academic year is required.",
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

  if (
    startDate < academicYear.startDate ||
    endDate > academicYear.endDate
  ) {
    return {
      error:
        "Term dates must fall within the academic year.",
    };
  }

  const [existingTermNumber] = await db
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

  if (existingTermNumber) {
    return {
      error:
        "This term number already exists for this academic year.",
    };
  }

  const [existingTermName] = await db
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

  if (existingTermName) {
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

      await tx.insert(terms).values({
        academicYearId: academicYear.id,
        name,
        termNumber,
        startDate,
        endDate,
        isCurrent,
      });
    });
  } catch (error) {
    console.error(
      "Failed to create term:",
      error,
    );

    return {
      error:
        "The term could not be created. Please try again.",
    };
  }

  redirect(
    `/academics/years/${academicYear.id}`,
  );
}