"use server";

import {
  and,
  eq,
  inArray,
  sql,
} from "drizzle-orm";
import { redirect } from "next/navigation";

import { db } from "@/db";
import {
  assessmentScores,
  assessments,
  studentEnrollments,
  studentPlacements,
  students,
} from "@/db/schema";
import {
  requireCurrentSchool,
} from "@/lib/current-school";
import {
  requireTeacherSubjectAccess,
} from "@/lib/authorization";

type ActionState = {
  error?: string;
};

type AssessmentStatus =
  | "draft"
  | "open"
  | "closed"
  | "published"
  | "archived";

const LOCKED_STATUSES: AssessmentStatus[] = [
  "closed",
  "published",
  "archived",
];

const VALID_TRANSITIONS: Record<
  AssessmentStatus,
  AssessmentStatus[]
> = {
  draft: ["open"],
  open: ["closed"],
  closed: ["published"],
  published: ["archived"],
  archived: [],
};

export async function saveAssessmentScores(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const assessmentId = String(
    formData.get("assessmentId") ?? "",
  ).trim();

  if (!assessmentId) {
    return {
      error: "Assessment is required.",
    };
  }

  const school = await requireCurrentSchool();

  /*
   * Load the assessment first because the teacher authorization
   * check needs its stream, subject and academic year.
   */
  const [assessment] = await db
    .select()
    .from(assessments)
    .where(
      and(
        eq(assessments.id, assessmentId),
        eq(assessments.schoolId, school.id),
      ),
    )
    .limit(1);

  if (!assessment) {
    return {
      error: "Assessment not found.",
    };
  }

  /*
   * SECURITY BOUNDARY
   *
   * Platform administrators and school administrators are allowed
   * through by requireTeacherSubjectAccess().
   *
   * Ordinary teachers must have either:
   *
   * 1. an explicit subject + stream + academic-year assignment, or
   * 2. a class-teacher assignment for that stream + academic year.
   */
  try {
    await requireTeacherSubjectAccess(
      assessment.streamId,
      assessment.subjectId,
      assessment.academicYearId,
      school.id,
    );
  } catch {
    return {
      error:
        "You are not authorized to enter scores for this assessment.",
    };
  }

  if (
    LOCKED_STATUSES.includes(
      assessment.status as AssessmentStatus,
    )
  ) {
    return {
      error:
        "This assessment is locked and cannot be edited.",
    };
  }

  const maxScore = Number(
    assessment.maxScore,
  );

  if (
    !Number.isFinite(maxScore) ||
    maxScore <= 0
  ) {
    return {
      error:
        "This assessment has an invalid maximum score.",
    };
  }

  const entries: {
    studentId: string;
    score: number;
    comment: string | null;
  }[] = [];

  for (const [key, rawValue] of formData.entries()) {
    if (!key.startsWith("score_")) {
      continue;
    }

    const studentId =
      key.slice("score_".length);

    const value =
      String(rawValue).trim();

    if (!value) {
      continue;
    }

    const score = Number(value);

    if (
      !Number.isFinite(score) ||
      score < 0 ||
      score > maxScore
    ) {
      return {
        error: `Invalid score for student ${studentId}. Scores must be between 0 and ${maxScore}.`,
      };
    }

    const commentValue =
      String(
        formData.get(
          `comment_${studentId}`,
        ) ?? "",
      ).trim();

    entries.push({
      studentId,
      score,
      comment:
        commentValue || null,
    });
  }

  if (entries.length === 0) {
    return {
      error:
        "Enter at least one student score.",
    };
  }

  const submittedStudentIds = [
    ...new Set(
      entries.map(
        (entry) => entry.studentId,
      ),
    ),
  ];

  /*
   * Only students who are:
   *
   * - in this school
   * - actively enrolled in the assessment year
   * - actively placed
   * - placed in this assessment stream
   *
   * may receive a score.
   */
  const validStudents =
    await db
      .select({
        id: students.id,
      })
      .from(studentPlacements)
      .innerJoin(
        studentEnrollments,
        eq(
          studentPlacements.studentEnrollmentId,
          studentEnrollments.id,
        ),
      )
      .innerJoin(
        students,
        eq(
          studentEnrollments.studentId,
          students.id,
        ),
      )
      .where(
        and(
          eq(
            studentPlacements.streamId,
            assessment.streamId,
          ),
          eq(
            studentPlacements.status,
            "active",
          ),
          eq(
            studentEnrollments.academicYearId,
            assessment.academicYearId,
          ),
          eq(
            studentEnrollments.status,
            "active",
          ),
          eq(
            students.schoolId,
            school.id,
          ),
          inArray(
            students.id,
            submittedStudentIds,
          ),
        ),
      );

  const validStudentIds =
    new Set(
      validStudents.map(
        (student) => student.id,
      ),
    );

  for (const entry of entries) {
    if (
      !validStudentIds.has(
        entry.studentId,
      )
    ) {
      return {
        error:
          "One or more submitted students are not currently enrolled and placed in this assessment stream.",
      };
    }
  }

  try {
    await db.transaction(
      async (tx) => {
        /*
         * Prevent concurrent writes to the same assessment.
         */
        await tx.execute(sql`
          SELECT pg_advisory_xact_lock(
            hashtext(${assessment.id})
          )
        `);

        /*
         * Re-check the status inside the transaction.
         */
        const [lockedAssessment] =
          await tx
            .select({
              status:
                assessments.status,
            })
            .from(assessments)
            .where(
              and(
                eq(
                  assessments.id,
                  assessment.id,
                ),
                eq(
                  assessments.schoolId,
                  school.id,
                ),
              ),
            )
            .limit(1);

        if (
          !lockedAssessment ||
          LOCKED_STATUSES.includes(
            lockedAssessment.status as AssessmentStatus,
          )
        ) {
          throw new Error(
            "ASSESSMENT_LOCKED",
          );
        }

        for (const entry of entries) {
          await tx
            .insert(assessmentScores)
            .values({
              assessmentId:
                assessment.id,
              studentId:
                entry.studentId,
              score:
                entry.score.toFixed(2),
              comment:
                entry.comment,
            })
            .onConflictDoUpdate({
              target: [
                assessmentScores.assessmentId,
                assessmentScores.studentId,
              ],
              set: {
                score:
                  entry.score.toFixed(2),
                comment:
                  entry.comment,
                updatedAt:
                  new Date(),
              },
            });
        }
      },
    );
  } catch (error) {
    if (
      error instanceof Error &&
      error.message ===
        "ASSESSMENT_LOCKED"
    ) {
      return {
        error:
          "This assessment was locked before your changes could be saved.",
      };
    }

    console.error(
      "Failed to save assessment scores:",
      error,
    );

    return {
      error:
        "Scores could not be saved.",
    };
  }

  redirect(
    `/assessments/${assessment.id}`,
  );
}

export async function transitionAssessment(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const assessmentId = String(
    formData.get("assessmentId") ?? "",
  ).trim();

  const targetStatus = String(
    formData.get("targetStatus") ?? "",
  ).trim() as AssessmentStatus;

  if (!assessmentId) {
    return {
      error: "Assessment is required.",
    };
  }

  if (
    ![
      "draft",
      "open",
      "closed",
      "published",
      "archived",
    ].includes(targetStatus)
  ) {
    return {
      error:
        "Invalid assessment status.",
    };
  }

  const school =
    await requireCurrentSchool();

  /*
   * Fetch the assessment before opening the transaction so that
   * authorization can be checked against its actual resource scope.
   */
  const [authorizationAssessment] =
    await db
      .select({
        id: assessments.id,
        streamId:
          assessments.streamId,
        subjectId:
          assessments.subjectId,
        academicYearId:
          assessments.academicYearId,
      })
      .from(assessments)
      .where(
        and(
          eq(
            assessments.id,
            assessmentId,
          ),
          eq(
            assessments.schoolId,
            school.id,
          ),
        ),
      )
      .limit(1);

  if (!authorizationAssessment) {
    return {
      error: "Assessment not found.",
    };
  }

  /*
   * SECURITY BOUNDARY
   *
   * The lifecycle operation is restricted to the same teacher
   * scope as score entry.
   */
  try {
    await requireTeacherSubjectAccess(
      authorizationAssessment.streamId,
      authorizationAssessment.subjectId,
      authorizationAssessment.academicYearId,
      school.id,
    );
  } catch {
    return {
      error:
        "You are not authorized to change the lifecycle of this assessment.",
    };
  }

  try {
    await db.transaction(
      async (tx) => {
        await tx.execute(sql`
          SELECT pg_advisory_xact_lock(
            hashtext(${assessmentId})
          )
        `);

        const [assessment] =
          await tx
            .select({
              id: assessments.id,
              status:
                assessments.status,
              streamId:
                assessments.streamId,
              academicYearId:
                assessments.academicYearId,
            })
            .from(assessments)
            .where(
              and(
                eq(
                  assessments.id,
                  assessmentId,
                ),
                eq(
                  assessments.schoolId,
                  school.id,
                ),
              ),
            )
            .limit(1);

        if (!assessment) {
          throw new Error(
            "ASSESSMENT_NOT_FOUND",
          );
        }

        const currentStatus =
          assessment.status as AssessmentStatus;

        const allowedTransitions =
          VALID_TRANSITIONS[
            currentStatus
          ];

        if (
          !allowedTransitions.includes(
            targetStatus,
          )
        ) {
          throw new Error(
            `INVALID_TRANSITION:${currentStatus}:${targetStatus}`,
          );
        }

        /*
         * Publishing requires every active student in the
         * assessment stream/year to have a score.
         */
        if (
          targetStatus ===
          "published"
        ) {
          const [studentCount] =
            await tx
              .select({
                count:
                  sql<number>`count(*)`,
              })
              .from(
                studentPlacements,
              )
              .innerJoin(
                studentEnrollments,
                eq(
                  studentPlacements.studentEnrollmentId,
                  studentEnrollments.id,
                ),
              )
              .innerJoin(
                students,
                eq(
                  studentEnrollments.studentId,
                  students.id,
                ),
              )
              .where(
                and(
                  eq(
                    studentPlacements.streamId,
                    assessment.streamId,
                  ),
                  eq(
                    studentPlacements.status,
                    "active",
                  ),
                  eq(
                    studentEnrollments.academicYearId,
                    assessment.academicYearId,
                  ),
                  eq(
                    studentEnrollments.status,
                    "active",
                  ),
                  eq(
                    students.schoolId,
                    school.id,
                  ),
                ),
              );

          const [scoreCount] =
            await tx
              .select({
                count:
                  sql<number>`count(*)`,
              })
              .from(
                assessmentScores,
              )
              .where(
                eq(
                  assessmentScores.assessmentId,
                  assessment.id,
                ),
              );

          const requiredCount =
            Number(
              studentCount?.count ?? 0,
            );

          const enteredCount =
            Number(
              scoreCount?.count ?? 0,
            );

          if (
            requiredCount > 0 &&
            enteredCount <
              requiredCount
          ) {
            throw new Error(
              `INCOMPLETE_SCORES:${enteredCount}:${requiredCount}`,
            );
          }
        }

        await tx
          .update(assessments)
          .set({
            status:
              targetStatus,
            updatedAt:
              new Date(),
          })
          .where(
            and(
              eq(
                assessments.id,
                assessment.id,
              ),
              eq(
                assessments.schoolId,
                school.id,
              ),
            ),
          );
      },
    );
  } catch (error) {
    if (
      error instanceof Error
    ) {
      if (
        error.message ===
        "ASSESSMENT_NOT_FOUND"
      ) {
        return {
          error:
            "Assessment not found.",
        };
      }

      if (
        error.message.startsWith(
          "INVALID_TRANSITION:",
        )
      ) {
        const [, from, to] =
          error.message.split(":");

        return {
          error: `Cannot move assessment from ${from} to ${to}.`,
        };
      }

      if (
        error.message.startsWith(
          "INCOMPLETE_SCORES:",
        )
      ) {
        const [, entered, required] =
          error.message.split(":");

        return {
          error: `All students must have scores before publishing. ${entered} of ${required} scores are currently entered.`,
        };
      }
    }

    console.error(
      "Failed to transition assessment:",
      error,
    );

    return {
      error:
        "Assessment status could not be changed.",
    };
  }

  redirect(
    `/assessments/${assessmentId}`,
  );
}