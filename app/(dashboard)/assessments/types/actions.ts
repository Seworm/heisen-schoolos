"use server";

import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { db } from "@/db";
import { assessmentTypes, assessments, gradingSchemeItems } from "@/db/schema";
import { requireCurrentSchool } from "@/lib/current-school";

type ActionState = {
  error?: string;
  success?: string;
};

type AssessmentTypeCategory =
  | "continuous_assessment"
  | "examination";

export async function deleteAssessmentType(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const school = await requireCurrentSchool();
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return { error: "Assessment type is required." };

  const [assessmentType] = await db
    .select({ id: assessmentTypes.id })
    .from(assessmentTypes)
    .where(and(eq(assessmentTypes.id, id), eq(assessmentTypes.schoolId, school.id)))
    .limit(1);

  if (!assessmentType) return { error: "Assessment type not found." };

  const [gradingSchemeUse] = await db
    .select({ id: gradingSchemeItems.id })
    .from(gradingSchemeItems)
    .where(eq(gradingSchemeItems.assessmentTypeId, id))
    .limit(1);
  const [assessmentUse] = await db
    .select({ id: assessments.id })
    .from(assessments)
    .where(eq(assessments.assessmentTypeId, id))
    .limit(1);

  if (gradingSchemeUse || assessmentUse) {
    return {
      error:
        "This assessment type cannot be deleted because it is already used by a grading scheme or assessment.",
    };
  }

  await db.delete(assessmentTypes).where(eq(assessmentTypes.id, id));
  return { success: "Assessment type deleted." };
}

export async function createAssessmentType(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const name = String(
    formData.get("name") ?? "",
  ).trim();

  const code =
    String(
      formData.get("code") ?? "",
    ).trim() || null;

  const category = String(
    formData.get("category") ?? "",
  ).trim();

  const description =
    String(
      formData.get("description") ?? "",
    ).trim() || null;

  if (!name) {
    return {
      error: "Assessment type name is required.",
    };
  }

  if (
    category !== "continuous_assessment" &&
    category !== "examination"
  ) {
    return {
      error: "Invalid assessment category.",
    };
  }

  const school = await requireCurrentSchool();

  try {
    const existingName = await db
      .select({
        id: assessmentTypes.id,
      })
      .from(assessmentTypes)
      .where(
        and(
          eq(
            assessmentTypes.schoolId,
            school.id,
          ),
          eq(
            assessmentTypes.name,
            name,
          ),
        ),
      )
      .limit(1);

    if (existingName.length > 0) {
      return {
        error:
          "An assessment type with this name already exists in this school.",
      };
    }

    if (code) {
      const existingCode = await db
        .select({
          id: assessmentTypes.id,
        })
        .from(assessmentTypes)
        .where(
          and(
            eq(
              assessmentTypes.schoolId,
              school.id,
            ),
            eq(
              assessmentTypes.code,
              code,
            ),
          ),
        )
        .limit(1);

      if (existingCode.length > 0) {
        return {
          error:
            "An assessment type with this code already exists in this school.",
        };
      }
    }

    await db.insert(assessmentTypes).values({
      schoolId: school.id,
      name,
      code,
      category:
        category as AssessmentTypeCategory,
      description,
    });
  } catch (error) {
    console.error(
      "Failed to create assessment type:",
      error,
    );

    return {
      error:
        "Assessment type could not be created. Please check the submitted details and try again.",
    };
  }

  redirect("/assessments/types");
}
