"use server";

import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { db } from "@/db";
import { assessmentTypes } from "@/db/schema";
import { requireCurrentSchool } from "@/lib/current-school";

type ActionState = {
  error?: string;
};

type AssessmentTypeCategory =
  | "continuous_assessment"
  | "examination";

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


