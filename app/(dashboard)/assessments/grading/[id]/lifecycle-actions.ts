"use server";

import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import {
  assessmentTypes,
  gradeBands,
  gradingSchemeItems,
  gradingSchemes,
} from "@/db/schema";
import { requireCurrentSchool } from "@/lib/current-school";

type Result =
  | {
      success: true;
    }
  | {
      success: false;
      error: string;
    };

export async function activateGradingScheme(
  schemeId: string,
): Promise<Result> {
  try {
    const school =
      await requireCurrentSchool();

    if (!schemeId?.trim()) {
      return {
        success: false,
        error:
          "Grading scheme ID is required.",
      };
    }

    await db.transaction(async (tx) => {
      /*
       * ----------------------------------------------------------
       * 1. Load the grading scheme.
       * ----------------------------------------------------------
       */
      const [scheme] = await tx
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
        throw new Error(
          "Grading scheme not found.",
        );
      }

      if (scheme.status === "archived") {
        throw new Error(
          "Archived grading schemes cannot be activated.",
        );
      }

      /*
       * ----------------------------------------------------------
       * 2. Load assessment components.
       * ----------------------------------------------------------
       */
      const items = await tx
        .select()
        .from(gradingSchemeItems)
        .where(
          eq(
            gradingSchemeItems.gradingSchemeId,
            scheme.id,
          ),
        );

      if (items.length === 0) {
        throw new Error(
          "Add assessment weights before activating the scheme.",
        );
      }

      /*
       * ----------------------------------------------------------
       * 3. Load the school's assessment types.
       *
       * We need the category because the system uses:
       *
       * Class Score = 50%
       * Examination  = 50%
       * ----------------------------------------------------------
       */
      const assessmentTypeRecords =
        await tx
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

      const categoryMap = new Map(
        assessmentTypeRecords.map(
          (type) => [
            type.id,
            type.category,
          ],
        ),
      );

      /*
       * ----------------------------------------------------------
       * 4. Validate assessment types and
       *    calculate Class Score / Exam weights.
       * ----------------------------------------------------------
       */
      let classScoreWeight = 0;
      let examinationWeight = 0;

      const seenAssessmentTypes =
        new Set<string>();

      for (const item of items) {
        if (
          seenAssessmentTypes.has(
            item.assessmentTypeId,
          )
        ) {
          throw new Error(
            "Each assessment type can only appear once in a grading scheme.",
          );
        }

        seenAssessmentTypes.add(
          item.assessmentTypeId,
        );

        const weight = Number(
          item.weightPercent,
        );

        if (
          !Number.isFinite(weight) ||
          weight <= 0 ||
          weight > 100
        ) {
          throw new Error(
            "Every assessment weight must be greater than 0% and no more than 100%.",
          );
        }

        const category =
          categoryMap.get(
            item.assessmentTypeId,
          );

        if (!category) {
          throw new Error(
            "One or more assessment types do not belong to this school.",
          );
        }

        if (
          category ===
          "continuous_assessment"
        ) {
          classScoreWeight += weight;
        } else if (
          category === "examination"
        ) {
          examinationWeight +=
            weight;
        } else {
          throw new Error(
            "Unsupported assessment category in grading scheme.",
          );
        }
      }

      classScoreWeight =
        Math.round(
          classScoreWeight * 100,
        ) / 100;

      examinationWeight =
        Math.round(
          examinationWeight * 100,
        ) / 100;

      /*
       * ----------------------------------------------------------
       * 5. Enforce the 50:50 model.
       * ----------------------------------------------------------
       */
      if (classScoreWeight !== 50) {
        throw new Error(
          `Class Score components must total exactly 50%. Current total is ${classScoreWeight}%.`,
        );
      }

      if (examinationWeight !== 50) {
        throw new Error(
          `Examination components must total exactly 50%. Current total is ${examinationWeight}%.`,
        );
      }

      /*
       * Overall weight must therefore be exactly 100%.
       */
      const totalWeight =
        classScoreWeight +
        examinationWeight;

      if (totalWeight !== 100) {
        throw new Error(
          "All grading components must total exactly 100%.",
        );
      }

      /*
       * ----------------------------------------------------------
       * 6. Load grade bands.
       * ----------------------------------------------------------
       */
      const bands = await tx
        .select()
        .from(gradeBands)
        .where(
          eq(
            gradeBands.gradingSchemeId,
            scheme.id,
          ),
        );

      if (bands.length === 0) {
        throw new Error(
          "Add grade bands before activating the scheme.",
        );
      }

      /*
       * ----------------------------------------------------------
       * 7. Validate grade bands.
       * ----------------------------------------------------------
       */
      const sortedBands =
        [...bands].sort(
          (a, b) =>
            Number(
              a.minimumPercent,
            ) -
            Number(
              b.minimumPercent,
            ),
        );

      const firstBand =
        sortedBands[0];

      const lastBand =
        sortedBands[
          sortedBands.length - 1
        ];

      if (
        Number(
          firstBand.minimumPercent,
        ) !== 0
      ) {
        throw new Error(
          "Grade bands must start at 0%.",
        );
      }

      if (
        Number(
          lastBand.maximumPercent,
        ) !== 100
      ) {
        throw new Error(
          "Grade bands must end at 100%.",
        );
      }

      /*
       * Check every band for a valid range
       * and ensure there are no gaps or overlaps.
       */
      const seenGrades =
        new Set<string>();

      for (
        let index = 0;
        index <
        sortedBands.length;
        index++
      ) {
        const band =
          sortedBands[index];

        const minimum =
          Number(
            band.minimumPercent,
          );

        const maximum =
          Number(
            band.maximumPercent,
          );

        if (
          !Number.isFinite(
            minimum,
          ) ||
          !Number.isFinite(
            maximum,
          ) ||
          minimum < 0 ||
          maximum > 100 ||
          minimum > maximum
        ) {
          throw new Error(
            "One or more grade bands has an invalid percentage range.",
          );
        }

        const grade =
          band.grade
            .trim()
            .toUpperCase();

        if (!grade) {
          throw new Error(
            "Every grade band must have a grade.",
          );
        }

        if (
          seenGrades.has(grade)
        ) {
          throw new Error(
            "Each grade can only appear once.",
          );
        }

        seenGrades.add(grade);

        /*
         * Check continuity with the
         * following band.
         */
        if (
          index <
          sortedBands.length - 1
        ) {
          const nextBand =
            sortedBands[
              index + 1
            ];

          const expectedMinimum =
            Math.round(
              (maximum + 0.01) *
                100,
            ) / 100;

          const nextMinimum =
            Number(
              nextBand.minimumPercent,
            );

          if (
            nextMinimum !==
            expectedMinimum
          ) {
            throw new Error(
              "Grade bands must cover 0% to 100% continuously without gaps or overlaps.",
            );
          }
        }
      }

      /*
       * ----------------------------------------------------------
       * 8. Archive the current active scheme.
       *
       * IMPORTANT:
       * We do this BEFORE activating the selected scheme.
       *
       * Otherwise the selected scheme could be activated and
       * immediately archived by the second update.
       * ----------------------------------------------------------
       */
      await tx
        .update(gradingSchemes)
        .set({
          status: "archived",
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(
              gradingSchemes.schoolId,
              school.id,
            ),
            eq(
              gradingSchemes.status,
              "active",
            ),
          ),
        );

      /*
       * ----------------------------------------------------------
       * 9. Activate the selected scheme.
       * ----------------------------------------------------------
       */
      await tx
        .update(gradingSchemes)
        .set({
          status: "active",
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(
              gradingSchemes.id,
              scheme.id,
            ),
            eq(
              gradingSchemes.schoolId,
              school.id,
            ),
          ),
        );
    });

    return {
      success: true,
    };
  } catch (error) {
    console.error(
      "activateGradingScheme error:",
      error,
    );

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "The grading scheme could not be activated.",
    };
  }
}

export async function archiveGradingScheme(
  schemeId: string,
): Promise<Result> {
  try {
    const school =
      await requireCurrentSchool();

    if (!schemeId?.trim()) {
      return {
        success: false,
        error:
          "Grading scheme ID is required.",
      };
    }

    const [scheme] = await db
      .select({
        id: gradingSchemes.id,
        status:
          gradingSchemes.status,
      })
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

    /*
     * Archiving an already archived scheme
     * is safely idempotent.
     */
    if (
      scheme.status ===
      "archived"
    ) {
      return {
        success: true,
      };
    }

    await db
      .update(gradingSchemes)
      .set({
        status: "archived",
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(
            gradingSchemes.id,
            scheme.id,
          ),
          eq(
            gradingSchemes.schoolId,
            school.id,
          ),
        ),
      );

    return {
      success: true,
    };
  } catch (error) {
    console.error(
      "archiveGradingScheme error:",
      error,
    );

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "The grading scheme could not be archived.",
    };
  }
}