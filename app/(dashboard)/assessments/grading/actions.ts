"use server";

import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { db } from "@/db";
import {
  assessmentTypes,
  gradeBands,
  gradingSchemeItems,
  gradingSchemes,
} from "@/db/schema";
import { requireCurrentSchool } from "@/lib/current-school";

type CreateActionState = {
  error?: string;
};

export async function createGradingScheme(
  _previousState: CreateActionState,
  formData: FormData,
): Promise<CreateActionState> {
  try {
    const school = await requireCurrentSchool();

    const name = String(
      formData.get("name") ?? "",
    ).trim();

    const description = String(
      formData.get("description") ?? "",
    ).trim();

    if (!name) {
      return {
        error:
          "Grading scheme name is required.",
      };
    }

    if (name.length > 150) {
      return {
        error:
          "Grading scheme name must not exceed 150 characters.",
      };
    }

    if (description.length > 5000) {
      return {
        error:
          "Description must not exceed 5000 characters.",
      };
    }

    const existing = await db
      .select({
        id: gradingSchemes.id,
      })
      .from(gradingSchemes)
      .where(
        and(
          eq(
            gradingSchemes.schoolId,
            school.id,
          ),
          eq(
            gradingSchemes.name,
            name,
          ),
        ),
      )
      .limit(1);

    if (existing.length > 0) {
      return {
        error:
          "A grading scheme with this name already exists.",
      };
    }

    const [created] = await db
      .insert(gradingSchemes)
      .values({
        schoolId: school.id,
        name,
        description:
          description || null,
        status: "draft",
      })
      .returning({
        id: gradingSchemes.id,
      });

    if (!created) {
      return {
        error:
          "The grading scheme could not be created.",
      };
    }

    redirect(
      `/assessments/grading/${created.id}`,
    );

    return {};
  } catch (error) {
    /*
     * Next.js redirect() throws internally.
     * Do not convert the redirect into
     * an application error.
     */
    if (
      error &&
      typeof error === "object" &&
      "digest" in error &&
      typeof error.digest === "string" &&
      error.digest.startsWith(
        "NEXT_REDIRECT",
      )
    ) {
      throw error;
    }

    console.error(
      "createGradingScheme error:",
      error,
    );

    return {
      error:
        error instanceof Error
          ? error.message
          : "The grading scheme could not be created.",
    };
  }
}

type SchemeItemInput = {
  id?: string;
  assessmentTypeId: string;
  weightPercent: number;
};

type GradeBandInput = {
  id?: string;
  grade: string;
  label: string;
  minimumPercent: number;
  maximumPercent: number;
  remark: string;
  sortOrder: number;
};

type SaveConfigurationInput = {
  schemeId: string;
  items: SchemeItemInput[];
  bands: GradeBandInput[];
};

type SaveConfigurationResult =
  | {
      success: true;
    }
  | {
      success: false;
      error: string;
    };

export async function saveGradingConfiguration(
  input: SaveConfigurationInput,
): Promise<SaveConfigurationResult> {
  try {
    const school =
      await requireCurrentSchool();

    /*
     * ------------------------------------------------------------
     * Basic request validation
     * ------------------------------------------------------------
     */

    if (
      !input ||
      typeof input !== "object"
    ) {
      return {
        success: false,
        error:
          "Invalid grading configuration.",
      };
    }

    const schemeId =
      typeof input.schemeId ===
      "string"
        ? input.schemeId.trim()
        : "";

    if (!schemeId) {
      return {
        success: false,
        error:
          "Grading scheme ID is required.",
      };
    }

    /*
     * ------------------------------------------------------------
     * Verify grading scheme belongs to
     * current school
     * ------------------------------------------------------------
     */

    const [scheme] = await db
      .select()
      .from(gradingSchemes)
      .where(
        and(
          eq(
            gradingSchemes.id,
            schemeId,
          ),
          eq(
            gradingSchemes.schoolId,
            school.id,
          ),
        ),
      )
      .limit(1);

    if (!scheme) {
      return {
        success: false,
        error:
          "Grading scheme not found.",
      };
    }

    if (
      scheme.status ===
      "archived"
    ) {
      return {
        success: false,
        error:
          "Archived grading schemes cannot be edited.",
      };
    }

    /*
     * ------------------------------------------------------------
     * Validate arrays
     * ------------------------------------------------------------
     */

    if (
      !Array.isArray(input.items) ||
      input.items.length === 0
    ) {
      return {
        success: false,
        error:
          "At least one assessment component is required.",
      };
    }

    if (
      !Array.isArray(input.bands) ||
      input.bands.length === 0
    ) {
      return {
        success: false,
        error:
          "At least one grade band is required.",
      };
    }

    /*
     * ------------------------------------------------------------
     * Normalize assessment components
     * ------------------------------------------------------------
     */

    const normalizedItems =
      input.items.map(
        (item) => ({
          assessmentTypeId:
            String(
              item.assessmentTypeId ??
                "",
            ).trim(),

          weightPercent: Number(
            item.weightPercent,
          ),
        }),
      );

    /*
     * ------------------------------------------------------------
     * Validate assessment weights
     * ------------------------------------------------------------
     */

    if (
      normalizedItems.some(
        (item) =>
          !item.assessmentTypeId ||
          !Number.isFinite(
            item.weightPercent,
          ) ||
          item.weightPercent <= 0 ||
          item.weightPercent > 100,
      )
    ) {
      return {
        success: false,
        error:
          "Every assessment weight must be greater than 0% and no more than 100%.",
      };
    }

    /*
     * ------------------------------------------------------------
     * Prevent duplicate assessment types
     * ------------------------------------------------------------
     */

    const assessmentTypeIds =
      normalizedItems.map(
        (item) =>
          item.assessmentTypeId,
      );

    if (
      new Set(
        assessmentTypeIds,
      ).size !==
      assessmentTypeIds.length
    ) {
      return {
        success: false,
        error:
          "Each assessment type can only appear once in a grading scheme.",
      };
    }

    /*
     * ------------------------------------------------------------
     * Load assessment types belonging
     * to current school
     * ------------------------------------------------------------
     */

    const assessmentTypeRecords =
      await db
        .select({
          id: assessmentTypes.id,
          category:
            assessmentTypes.category,
        })
        .from(assessmentTypes)
        .where(
          eq(
            assessmentTypes.schoolId,
            school.id,
          ),
        );

    /*
     * This single set is used for the
     * school-scope validation.
     *
     * There must NOT be another
     * validTypeIds declaration.
     */
    const validTypeIds =
      new Set(
        assessmentTypeRecords.map(
          (type) => type.id,
        ),
      );

    /*
     * ------------------------------------------------------------
     * Confirm all assessment types belong
     * to current school
     * ------------------------------------------------------------
     */

    if (
      normalizedItems.some(
        (item) =>
          !validTypeIds.has(
            item.assessmentTypeId,
          ),
      )
    ) {
      return {
        success: false,
        error:
          "One or more assessment types do not belong to this school.",
      };
    }

    /*
     * ------------------------------------------------------------
     * Map assessment type -> category
     * ------------------------------------------------------------
     */

    const assessmentTypeCategoryMap =
      new Map<
        string,
        string
      >(
        assessmentTypeRecords.map(
          (type) => [
            type.id,
            type.category,
          ],
        ),
      );

    /*
     * ------------------------------------------------------------
     * Enforce 50:50 grading model
     *
     * Continuous assessment = 50%
     * Examination = 50%
     * Total = 100%
     * ------------------------------------------------------------
     */

    let continuousAssessmentWeight =
      0;

    let examinationWeight = 0;

    for (const item of normalizedItems) {
      const category =
        assessmentTypeCategoryMap.get(
          item.assessmentTypeId,
        );

      if (!category) {
        return {
          success: false,
          error:
            "One or more assessment types do not belong to this school.",
        };
      }

      if (
        category ===
        "continuous_assessment"
      ) {
        continuousAssessmentWeight +=
          item.weightPercent;
      } else if (
        category ===
        "examination"
      ) {
        examinationWeight +=
          item.weightPercent;
      } else {
        return {
          success: false,
          error:
            "Unsupported assessment category.",
        };
      }
    }

    continuousAssessmentWeight =
      Math.round(
        continuousAssessmentWeight *
          100,
      ) / 100;

    examinationWeight =
      Math.round(
        examinationWeight *
          100,
      ) / 100;

    /*
     * Class Score must be exactly 50%.
     */
    if (
      continuousAssessmentWeight !==
      50
    ) {
      return {
        success: false,
        error:
          `Class Score components must total exactly 50%. Current total is ${continuousAssessmentWeight}%.`,
      };
    }

    /*
     * Examination must be exactly 50%.
     */
    if (
      examinationWeight !==
      50
    ) {
      return {
        success: false,
        error:
          `Examination components must total exactly 50%. Current total is ${examinationWeight}%.`,
      };
    }

    /*
     * Final safety check.
     */
    const totalWeight =
      Math.round(
        (continuousAssessmentWeight +
          examinationWeight) *
          100,
      ) / 100;

    if (totalWeight !== 100) {
      return {
        success: false,
        error:
          "All assessment weights must total exactly 100%.",
      };
    }

    /*
     * ------------------------------------------------------------
     * Normalize grade bands
     * ------------------------------------------------------------
     */

    const normalizedBands =
      input.bands.map(
        (band) => ({
          grade: String(
            band.grade ?? "",
          )
            .trim()
            .toUpperCase(),

          label: String(
            band.label ?? "",
          ).trim(),

          minimumPercent:
            Number(
              band.minimumPercent,
            ),

          maximumPercent:
            Number(
              band.maximumPercent,
            ),

          remark: String(
            band.remark ?? "",
          ).trim(),

          sortOrder: Number.isFinite(
            Number(
              band.sortOrder,
            ),
          )
            ? Number(
                band.sortOrder,
              )
            : 0,
        }),
      );

    /*
     * ------------------------------------------------------------
     * Validate grade band values
     * ------------------------------------------------------------
     */

    if (
      normalizedBands.some(
        (band) =>
          !band.grade ||
          band.grade.length > 10 ||
          !Number.isFinite(
            band.minimumPercent,
          ) ||
          !Number.isFinite(
            band.maximumPercent,
          ) ||
          band.minimumPercent < 0 ||
          band.maximumPercent > 100 ||
          band.minimumPercent >
            band.maximumPercent,
      )
    ) {
      return {
        success: false,
        error:
          "One or more grade bands has an invalid percentage range.",
      };
    }

    /*
     * Round percentage boundaries
     * consistently before validation.
     */
    const roundedBands =
      normalizedBands.map(
        (band) => ({
          ...band,
          minimumPercent:
            Math.round(
              band.minimumPercent *
                100,
            ) / 100,
          maximumPercent:
            Math.round(
              band.maximumPercent *
                100,
            ) / 100,
        }),
      );

    /*
     * Sort by lower boundary.
     */
    const sortedBands =
      [...roundedBands].sort(
        (a, b) =>
          a.minimumPercent -
          b.minimumPercent,
      );

    /*
     * ------------------------------------------------------------
     * Grade bands must start at 0%
     * ------------------------------------------------------------
     */

    if (
      sortedBands[0]
        .minimumPercent !== 0
    ) {
      return {
        success: false,
        error:
          "Grade bands must start at 0%.",
      };
    }

    /*
     * ------------------------------------------------------------
     * Grade bands must end at 100%
     * ------------------------------------------------------------
     */

    const lastBand =
      sortedBands[
        sortedBands.length - 1
      ];

    if (
      lastBand.maximumPercent !==
      100
    ) {
      return {
        success: false,
        error:
          "Grade bands must end at 100%.",
      };
    }

    /*
     * ------------------------------------------------------------
     * Prevent duplicate grades
     * ------------------------------------------------------------
     */

    const gradeNames =
      sortedBands.map(
        (band) => band.grade,
      );

    if (
      new Set(
        gradeNames,
      ).size !==
      gradeNames.length
    ) {
      return {
        success: false,
        error:
          "Each grade can only appear once.",
      };
    }

    /*
     * ------------------------------------------------------------
     * Ensure grade bands are continuous
     *
     * Example:
     *
     * A: 80 - 100
     * B: 70 - 79.99
     *
     * becomes:
     *
     * 0 - 39.99
     * 40 - 49.99
     * 50 - 59.99
     * 60 - 69.99
     * 70 - 79.99
     * 80 - 100
     * ------------------------------------------------------------
     */

    for (
      let index = 0;
      index <
      sortedBands.length - 1;
      index++
    ) {
      const current =
        sortedBands[index];

      const next =
        sortedBands[index + 1];

      const expectedNextMinimum =
        Math.round(
          (current.maximumPercent +
            0.01) *
            100,
        ) / 100;

      if (
        next.minimumPercent !==
        expectedNextMinimum
      ) {
        return {
          success: false,
          error:
            "Grade bands must cover 0% to 100% continuously without gaps or overlaps.",
        };
      }
    }

    /*
     * ------------------------------------------------------------
     * Save everything atomically.
     *
     * If anything fails, neither the old
     * nor the new partial configuration
     * is left behind.
     * ------------------------------------------------------------
     */

    await db.transaction(
      async (tx) => {
        /*
         * Remove old assessment weights.
         */
        await tx
          .delete(
            gradingSchemeItems,
          )
          .where(
            eq(
              gradingSchemeItems.gradingSchemeId,
              scheme.id,
            ),
          );

        /*
         * Remove old grade bands.
         */
        await tx
          .delete(gradeBands)
          .where(
            eq(
              gradeBands.gradingSchemeId,
              scheme.id,
            ),
          );

        /*
         * Insert assessment weights.
         */
        await tx
          .insert(
            gradingSchemeItems,
          )
          .values(
            normalizedItems.map(
              (item) => ({
                gradingSchemeId:
                  scheme.id,

                assessmentTypeId:
                  item.assessmentTypeId,

                weightPercent:
                  String(
                    Math.round(
                      item.weightPercent *
                        100,
                    ) / 100,
                  ),
              }),
            ),
          );

        /*
         * Insert grade bands.
         */
        await tx
          .insert(gradeBands)
          .values(
            sortedBands.map(
              (
                band,
                index,
              ) => ({
                gradingSchemeId:
                  scheme.id,

                grade:
                  band.grade,

                label:
                  band.label ||
                  null,

                minimumPercent:
                  String(
                    band.minimumPercent,
                  ),

                maximumPercent:
                  String(
                    band.maximumPercent,
                  ),

                remark:
                  band.remark ||
                  null,

                sortOrder:
                  index + 1,
              }),
            ),
          );

        /*
         * Touch grading scheme timestamp.
         */
        await tx
          .update(
            gradingSchemes,
          )
          .set({
            updatedAt:
              new Date(),
          })
          .where(
            eq(
              gradingSchemes.id,
              scheme.id,
            ),
          );
      },
    );

    return {
      success: true,
    };
  } catch (error) {
    console.error(
      "saveGradingConfiguration error:",
      error,
    );

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "The grading configuration could not be saved.",
    };
  }
}