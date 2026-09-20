"use server";

import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import {
  resultPublicationAssessments,
  resultPublicationStudents,
  resultPublicationSubjects,
  resultPublications,
} from "@/db/schema";

import { requireCurrentSchool } from "@/lib/current-school";
import {
  checkResultReadiness,
  calculateAllReadyStudentResults,
} from "@/lib/result-readiness";
import { getResultDataset } from "@/lib/result-data";
import { calculatePosition } from "@/lib/results";

export type ResultActionState = {
  success: boolean;
  message: string;
};

function isNextRedirect(error: unknown): boolean {
  return (
    error instanceof Error &&
    error.message.includes("NEXT_REDIRECT")
  );
}

/**
 * Validate and mark a result set READY.
 *
 * READY means:
 * - grading configuration is valid
 * - all required scores exist
 * - scores are within range
 * - assessment types have weights
 * - CA = 50%
 * - examination = 50%
 * - grade bands are valid
 *
 * READY is not the same as PUBLISHED.
 */
export async function markResultsReady(
  _previousState: ResultActionState,
  formData: FormData,
): Promise<ResultActionState> {
  try {
    const school = await requireCurrentSchool();

    const academicYearId = String(
      formData.get("academicYearId") ?? "",
    );

    const termId = String(
      formData.get("termId") ?? "",
    );

    const streamId = String(
      formData.get("streamId") ?? "",
    );

    if (!academicYearId || !termId || !streamId) {
      return {
        success: false,
        message:
          "Academic year, term and stream are required.",
      };
    }

    const dataset = await getResultDataset({
      academicYearId,
      termId,
      streamId,
    });

    if (dataset.school.id !== school.id) {
      return {
        success: false,
        message:
          "The selected result set does not belong to the current school.",
      };
    }

    const readiness = checkResultReadiness(dataset);

    if (!readiness.ready) {
      const firstError = readiness.errors[0];

      return {
        success: false,
        message:
          firstError?.message ??
          "The result set is not ready for publication.",
      };
    }

    const existing = await db
      .select({
        id: resultPublications.id,
        status: resultPublications.status,
      })
      .from(resultPublications)
      .where(
        and(
          eq(
            resultPublications.schoolId,
            school.id,
          ),
          eq(
            resultPublications.academicYearId,
            academicYearId,
          ),
          eq(
            resultPublications.termId,
            termId,
          ),
          eq(
            resultPublications.streamId,
            streamId,
          ),
        ),
      )
      .limit(1);

    if (existing[0]?.status === "published") {
      return {
        success: false,
        message:
          "These results have already been published.",
      };
    }

    if (existing[0]?.status === "archived") {
      return {
        success: false,
        message:
          "These results have already been archived.",
      };
    }

    if (existing[0]) {
      await db
        .update(resultPublications)
        .set({
          status: "ready",
          gradingSchemeId:
            dataset.gradingScheme?.id ?? null,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(
              resultPublications.id,
              existing[0].id,
            ),
            eq(
              resultPublications.schoolId,
              school.id,
            ),
          ),
        );
    } else {
      await db
        .insert(resultPublications)
        .values({
          schoolId: school.id,
          academicYearId,
          termId,
          streamId,
          gradingSchemeId:
            dataset.gradingScheme?.id ?? null,
          status: "ready",
        });
    }

    return {
      success: true,
      message:
        "Results have passed validation and are ready for publication.",
    };
  } catch (error) {
    if (isNextRedirect(error)) {
      throw error;
    }

    console.error(
      "markResultsReady failed:",
      error,
    );

    return {
      success: false,
      message:
        "Unable to validate the results.",
    };
  }
}

/**
 * Publish a READY result set.
 *
 * Publication creates a complete immutable historical snapshot.
 *
 * Snapshot contains:
 * - student identity
 * - overall percentage
 * - overall position
 * - subject results
 * - subject position
 * - assessment-level results
 * - grading labels
 * - grading remarks
 *
 * PostgreSQL numeric columns are represented as strings
 * by Drizzle, so numeric values are explicitly converted
 * to strings before insertion.
 */
export async function publishResults(
  _previousState: ResultActionState,
  formData: FormData,
): Promise<ResultActionState> {
  try {
    const school = await requireCurrentSchool();

    const academicYearId = String(
      formData.get("academicYearId") ?? "",
    );

    const termId = String(
      formData.get("termId") ?? "",
    );

    const streamId = String(
      formData.get("streamId") ?? "",
    );

    if (!academicYearId || !termId || !streamId) {
      return {
        success: false,
        message:
          "Academic year, term and stream are required.",
      };
    }

    const dataset = await getResultDataset({
      academicYearId,
      termId,
      streamId,
    });

    if (dataset.school.id !== school.id) {
      return {
        success: false,
        message:
          "The selected result set does not belong to the current school.",
      };
    }

    /*
     * Always revalidate immediately before publication.
     *
     * This prevents a result set that was READY earlier from
     * being published after its underlying scores/configuration
     * have changed.
     */
    const readiness = checkResultReadiness(dataset);

    if (!readiness.ready) {
      return {
        success: false,
        message:
          "Results are not ready. Resolve all validation errors before publishing.",
      };
    }

    const [publication] = await db
      .select()
      .from(resultPublications)
      .where(
        and(
          eq(
            resultPublications.schoolId,
            school.id,
          ),
          eq(
            resultPublications.academicYearId,
            academicYearId,
          ),
          eq(
            resultPublications.termId,
            termId,
          ),
          eq(
            resultPublications.streamId,
            streamId,
          ),
        ),
      )
      .limit(1);

    if (!publication) {
      return {
        success: false,
        message:
          "Results must be marked READY before they can be published.",
      };
    }

    if (publication.status !== "ready") {
      return {
        success: false,
        message:
          `Results cannot be published from the current ${publication.status} status.`,
      };
    }

    const studentResults =
      calculateAllReadyStudentResults(dataset);

    /*
     * ==========================================================
     * OVERALL RANKING
     * ==========================================================
     *
     * Competition ranking:
     *
     * 1
     * 2
     * 2
     * 4
     *
     * calculatePosition() handles ties consistently.
     */
    const rankedOverallResults =
      calculatePosition(
        studentResults.map((student) => ({
          studentId: student.studentId,
          percentage: student.overallPercentage,
        })),
      );

    /*
     * Map:
     *
     * studentId -> overall position
     */
    const overallPositionMap = new Map<
      string,
      number
    >(
      rankedOverallResults.map((result) => [
        result.studentId,
        result.position,
      ]),
    );

    /*
     * ==========================================================
     * SUBJECT RANKINGS
     * ==========================================================
     *
     * Every subject is ranked independently.
     *
     * Example:
     *
     * Mathematics:
     * Student A = 85
     * Student B = 78
     * Student C = 78
     * Student D = 66
     *
     * Positions:
     * Student A = 1
     * Student B = 2
     * Student C = 2
     * Student D = 4
     *
     * English is ranked separately.
     * Science is ranked separately.
     * Every subject gets its own ranking map.
     */
    const subjectPositionMaps = new Map<
      string,
      Map<string, number>
    >();

    const subjectIds = new Set<string>();

    for (const student of studentResults) {
      for (const subject of student.subjects) {
        subjectIds.add(subject.subjectId);
      }
    }

    for (const subjectId of subjectIds) {
      const subjectRankings = studentResults.map(
        (student) => {
          const subject = student.subjects.find(
            (item) =>
              item.subjectId === subjectId,
          );

          return {
            studentId: student.studentId,
            percentage:
              subject?.finalPercentage ?? 0,
          };
        },
      );

      const rankedSubjectResults =
        calculatePosition(
          subjectRankings,
        );

      subjectPositionMaps.set(
        subjectId,
        new Map(
          rankedSubjectResults.map(
            (result) => [
              result.studentId,
              result.position,
            ],
          ),
        ),
      );
    }

    await db.transaction(async (tx) => {
      /*
       * Rebuild the child snapshot rows.
       *
       * The publication is still READY at this point.
       *
       * If any insert fails, the transaction rolls back and
       * the publication remains READY.
       */
      await tx
        .delete(resultPublicationStudents)
        .where(
          eq(
            resultPublicationStudents.publicationId,
            publication.id,
          ),
        );

      for (const studentResult of studentResults) {
        const student = dataset.students.find(
          (item) =>
            item.id ===
            studentResult.studentId,
        );

        if (!student) {
          throw new Error(
            "A published student could not be matched to the result dataset.",
          );
        }

        const overallPosition =
  overallPositionMap.get(
    studentResult.studentId,
  );

if (overallPosition === undefined) {
  throw new Error(
    `Unable to determine overall position for student ${student.studentNumber}.`,
  );
}

        const [publicationStudent] =
          await tx
            .insert(
              resultPublicationStudents,
            )
            .values({
              publicationId:
                publication.id,

              studentId:
                student.id,

              studentNumber:
                student.studentNumber,

              firstName:
                student.firstName,

              middleName:
                student.middleName,

              lastName:
                student.lastName,

              overallPercentage:
                String(
                  studentResult.overallPercentage,
                ),

              position:
                overallPosition,
            })
            .returning({
              id:
                resultPublicationStudents.id,
            });

        if (!publicationStudent) {
          throw new Error(
            `Failed to create publication record for student ${student.studentNumber}.`,
          );
        }

        /*
         * ========================================================
         * SUBJECT SNAPSHOT
         * ========================================================
         *
         * Each subject stores:
         *
         * - class score
         * - examination score
         * - final percentage
         * - grade
         * - label
         * - remark
         * - subject position
         */
        for (const subject of
          studentResult.subjects) {
          const subjectPosition =
  subjectPositionMaps
    .get(subject.subjectId)
    ?.get(
      studentResult.studentId,
    );

if (subjectPosition === undefined) {
  throw new Error(
    `Unable to determine position for ${subject.subjectName} for student ${student.studentNumber}.`,
  );
}

          const [publicationSubject] =
            await tx
              .insert(
                resultPublicationSubjects,
              )
              .values({
                publicationStudentId:
                  publicationStudent.id,

                subjectId:
                  subject.subjectId,

                subjectName:
                  subject.subjectName,

                classScore:
                  String(
                    subject.classScore,
                  ),

                examinationScore:
                  String(
                    subject.examinationScore,
                  ),

                finalPercentage:
                  String(
                    subject.finalPercentage,
                  ),

                grade:
                  subject.grade?.grade ??
                  null,

                label:
                  subject.grade?.label ??
                  null,

                /*
                 * Prefer the explicit grading-scheme remark.
                 *
                 * If the scheme does not provide a remark,
                 * fall back to the grade label.
                 */
                remark:
                  subject.grade?.remark ??
                  subject.grade?.label ??
                  null,

                /*
                 * Historical subject position.
                 *
                 * This is stored at publication time and is
                 * therefore independent of future recalculation.
                 */
                position:
                  subjectPosition,
              })
              .returning({
                id:
                  resultPublicationSubjects.id,
              });

          if (!publicationSubject) {
            throw new Error(
              `Failed to create publication subject for ${subject.subjectName}.`,
            );
          }

          /*
           * ======================================================
           * ASSESSMENT SNAPSHOT
           * ======================================================
           */
          for (const assessment of
            subject.assessments) {
            await tx
              .insert(
                resultPublicationAssessments,
              )
              .values({
                publicationSubjectId:
                  publicationSubject.id,

                assessmentId:
                  assessment.assessmentId,

                assessmentName:
                  assessment.assessmentName,

                /*
                 * IMPORTANT:
                 * This is the assessment TYPE name,
                 * not the assessment name.
                 *
                 * Example:
                 * assessmentName     = "CAT 1"
                 * assessmentTypeName = "Continuous Assessment"
                 */
                assessmentTypeName:
                  assessment.assessmentTypeName,

                category:
                  assessment.category,

                score:
                  String(
                    assessment.score,
                  ),

                maxScore:
                  String(
                    assessment.maxScore,
                  ),

                percentage:
                  String(
                    assessment.percentage,
                  ),

                weightPercent:
                  String(
                    assessment.weightPercent,
                  ),

                weightedContribution:
                  String(
                    assessment.weightedContribution,
                  ),
              });
          }
        }
      }

      /*
       * Only mark the publication PUBLISHED after every
       * snapshot row has successfully been inserted.
       *
       * If anything above throws, PostgreSQL rolls the entire
       * transaction back.
       */
      await tx
        .update(resultPublications)
        .set({
          status: "published",
          publishedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(
              resultPublications.id,
              publication.id,
            ),
            eq(
              resultPublications.schoolId,
              school.id,
            ),
          ),
        );
    });

    return {
      success: true,
      message:
        "Results published successfully. Overall and subject positions have been stored in the historical publication snapshot.",
    };
  } catch (error) {
    if (isNextRedirect(error)) {
      throw error;
    }

    console.error(
      "publishResults failed:",
      error,
    );

    return {
      success: false,
      message:
        "Unable to publish the results.",
    };
  }
}

