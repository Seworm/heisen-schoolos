"use server";

import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import {
  reportCards,
  resultPublicationStudents,
  resultPublications,
} from "@/db/schema";
import { requireCurrentSchool } from "@/lib/current-school";

type ActionState = {
  success: boolean;
  message: string;
  count?: number;
};

function isNextRedirect(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    typeof error.digest === "string" &&
    error.digest.startsWith("NEXT_REDIRECT")
  );
}

function reportCardsPath(publicationId: string) {
  return `/assessments/results/published/${publicationId}/report-cards`;
}

/*
 * ============================================================
 * ENSURE REPORT CARDS
 * ============================================================
 *
 * Creates one report-card workflow record for every student
 * contained in the published result publication.
 *
 * Existing report cards are never duplicated.
 */

export async function ensureReportCards(
  publicationId: string,
): Promise<ActionState> {
  try {
    const school = await requireCurrentSchool();

    const [publication] = await db
      .select({
        id: resultPublications.id,
        status: resultPublications.status,
      })
      .from(resultPublications)
      .where(
        and(
          eq(resultPublications.id, publicationId),
          eq(resultPublications.schoolId, school.id),
        ),
      )
      .limit(1);

    if (!publication) {
      return {
        success: false,
        message: "Published result publication was not found.",
      };
    }

    if (publication.status !== "published") {
      return {
        success: false,
        message:
          "Report cards can only be created from published results.",
      };
    }

    const students = await db
      .select({
        id: resultPublicationStudents.id,
      })
      .from(resultPublicationStudents)
      .where(
        eq(
          resultPublicationStudents.publicationId,
          publication.id,
        ),
      );

    if (students.length === 0) {
      return {
        success: false,
        message:
          "No students were found in this published result.",
      };
    }

    const existing = await db
      .select({
        publicationStudentId:
          reportCards.publicationStudentId,
      })
      .from(reportCards)
      .where(
        and(
          eq(reportCards.schoolId, school.id),
          eq(
            reportCards.publicationId,
            publication.id,
          ),
        ),
      );

    const existingIds = new Set(
      existing.map(
        (row) => row.publicationStudentId,
      ),
    );

    const missingStudents = students.filter(
      (student) => !existingIds.has(student.id),
    );

    if (missingStudents.length === 0) {
      return {
        success: true,
        message: "All report cards already exist.",
        count: 0,
      };
    }

    await db.insert(reportCards).values(
      missingStudents.map((student) => ({
        schoolId: school.id,
        publicationId: publication.id,
        publicationStudentId: student.id,
        status: "draft" as const,
      })),
    );

    revalidatePath(
      reportCardsPath(publication.id),
    );

    return {
      success: true,
      message: `${missingStudents.length} report card${
        missingStudents.length === 1 ? "" : "s"
      } created.`,
      count: missingStudents.length,
    };
  } catch (error) {
    if (isNextRedirect(error)) {
      throw error;
    }

    console.error(
      "ensureReportCards failed:",
      error,
    );

    return {
      success: false,
      message: "Failed to create report cards.",
    };
  }
}

/*
 * ============================================================
 * SUBMIT SELECTED DRAFT REPORT CARDS
 * ============================================================
 *
 * draft → teacher_review
 */

export async function submitSelectedReportCards(
  publicationId: string,
  reportCardIds: string[],
): Promise<ActionState> {
  try {
    const school = await requireCurrentSchool();

    const uniqueIds = [
      ...new Set(
        reportCardIds.filter(Boolean),
      ),
    ];

    if (uniqueIds.length === 0) {
      return {
        success: false,
        message: "No report cards were selected.",
      };
    }

    const result = await db.transaction(
      async (tx) => {
        const rows = await tx
          .select({
            id: reportCards.id,
            status: reportCards.status,
          })
          .from(reportCards)
          .where(
            and(
              eq(reportCards.schoolId, school.id),
              eq(
                reportCards.publicationId,
                publicationId,
              ),
              inArray(
                reportCards.id,
                uniqueIds,
              ),
            ),
          );

        if (rows.length !== uniqueIds.length) {
          return {
            success: false,
            message:
              "Some selected report cards could not be found.",
          };
        }

        const invalid = rows.filter(
          (row) => row.status !== "draft",
        );

        if (invalid.length > 0) {
          return {
            success: false,
            message:
              "Only draft report cards can be submitted for teacher review.",
          };
        }

        await tx
          .update(reportCards)
          .set({
            status: "teacher_review",
          })
          .where(
            and(
              eq(
                reportCards.schoolId,
                school.id,
              ),
              eq(
                reportCards.publicationId,
                publicationId,
              ),
              inArray(
                reportCards.id,
                uniqueIds,
              ),
            ),
          );

        return {
          success: true,
          message: `${uniqueIds.length} report card${
            uniqueIds.length === 1
              ? ""
              : "s"
          } submitted for teacher review.`,
          count: uniqueIds.length,
        };
      },
    );

    revalidatePath(
      reportCardsPath(publicationId),
    );

    return result;
  } catch (error) {
    if (isNextRedirect(error)) {
      throw error;
    }

    console.error(
      "submitSelectedReportCards failed:",
      error,
    );

    return {
      success: false,
      message:
        "Failed to submit selected report cards.",
    };
  }
}

/*
 * ============================================================
 * SUBMIT ALL DRAFT REPORT CARDS
 * ============================================================
 *
 * draft → teacher_review
 */

export async function submitAllDraftReportCards(
  publicationId: string,
): Promise<ActionState> {
  try {
    const school = await requireCurrentSchool();

    const result = await db.transaction(
      async (tx) => {
        const [publication] = await tx
          .select({
            id: resultPublications.id,
            status: resultPublications.status,
          })
          .from(resultPublications)
          .where(
            and(
              eq(
                resultPublications.id,
                publicationId,
              ),
              eq(
                resultPublications.schoolId,
                school.id,
              ),
            ),
          )
          .limit(1);

        if (!publication) {
          return {
            success: false,
            message:
              "Published result publication was not found.",
          };
        }

        if (publication.status !== "published") {
          return {
            success: false,
            message:
              "Only published results can be submitted for review.",
          };
        }

        const drafts = await tx
          .select({
            id: reportCards.id,
          })
          .from(reportCards)
          .where(
            and(
              eq(
                reportCards.schoolId,
                school.id,
              ),
              eq(
                reportCards.publicationId,
                publication.id,
              ),
              eq(
                reportCards.status,
                "draft",
              ),
            ),
          );

        if (drafts.length === 0) {
          return {
            success: true,
            message:
              "There are no draft report cards to submit.",
            count: 0,
          };
        }

        const ids = drafts.map(
          (row) => row.id,
        );

        await tx
          .update(reportCards)
          .set({
            status: "teacher_review",
          })
          .where(
            and(
              eq(
                reportCards.schoolId,
                school.id,
              ),
              eq(
                reportCards.publicationId,
                publication.id,
              ),
              eq(
                reportCards.status,
                "draft",
              ),
              inArray(
                reportCards.id,
                ids,
              ),
            ),
          );

        return {
          success: true,
          message: `${ids.length} report card${
            ids.length === 1 ? "" : "s"
          } submitted for teacher review.`,
          count: ids.length,
        };
      },
    );

    revalidatePath(
      reportCardsPath(publicationId),
    );

    return result;
  } catch (error) {
    if (isNextRedirect(error)) {
      throw error;
    }

    console.error(
      "submitAllDraftReportCards failed:",
      error,
    );

    return {
      success: false,
      message:
        "Failed to submit report cards for teacher review.",
    };
  }
}

/*
 * ============================================================
 * SEND SELECTED TO HEADTEACHER
 * ============================================================
 *
 * teacher_review → headteacher_review
 */

export async function sendSelectedToHeadteacher(
  publicationId: string,
  reportCardIds: string[],
): Promise<ActionState> {
  try {
    const school = await requireCurrentSchool();

    const uniqueIds = [
      ...new Set(
        reportCardIds.filter(Boolean),
      ),
    ];

    if (uniqueIds.length === 0) {
      return {
        success: false,
        message: "No report cards were selected.",
      };
    }

    const result = await db.transaction(
      async (tx) => {
        const rows = await tx
          .select({
            id: reportCards.id,
            status: reportCards.status,
          })
          .from(reportCards)
          .where(
            and(
              eq(
                reportCards.schoolId,
                school.id,
              ),
              eq(
                reportCards.publicationId,
                publicationId,
              ),
              inArray(
                reportCards.id,
                uniqueIds,
              ),
            ),
          );

        if (rows.length !== uniqueIds.length) {
          return {
            success: false,
            message:
              "Some selected report cards could not be found.",
          };
        }

        const invalid = rows.filter(
          (row) =>
            row.status !==
            "teacher_review",
        );

        if (invalid.length > 0) {
          return {
            success: false,
            message:
              "Only report cards in teacher review can be sent to the headteacher.",
          };
        }

        await tx
          .update(reportCards)
          .set({
            status: "headteacher_review",
            classTeacherSignedAt:
              new Date(),
          })
          .where(
            and(
              eq(
                reportCards.schoolId,
                school.id,
              ),
              eq(
                reportCards.publicationId,
                publicationId,
              ),
              inArray(
                reportCards.id,
                uniqueIds,
              ),
            ),
          );

        return {
          success: true,
          message: `${uniqueIds.length} report card${
            uniqueIds.length === 1
              ? ""
              : "s"
          } sent to headteacher review.`,
          count: uniqueIds.length,
        };
      },
    );

    revalidatePath(
      reportCardsPath(publicationId),
    );

    return result;
  } catch (error) {
    if (isNextRedirect(error)) {
      throw error;
    }

    console.error(
      "sendSelectedToHeadteacher failed:",
      error,
    );

    return {
      success: false,
      message:
        "Failed to send selected report cards to the headteacher.",
    };
  }
}

/*
 * ============================================================
 * SEND ALL TEACHER-REVIEW REPORT CARDS
 * ============================================================
 */

export async function sendAllToHeadteacher(
  publicationId: string,
): Promise<ActionState> {
  try {
    const school = await requireCurrentSchool();

    const result = await db.transaction(
      async (tx) => {
        const cards = await tx
          .select({
            id: reportCards.id,
          })
          .from(reportCards)
          .where(
            and(
              eq(
                reportCards.schoolId,
                school.id,
              ),
              eq(
                reportCards.publicationId,
                publicationId,
              ),
              eq(
                reportCards.status,
                "teacher_review",
              ),
            ),
          );

        if (cards.length === 0) {
          return {
            success: true,
            message:
              "There are no teacher-review report cards to send.",
            count: 0,
          };
        }

        const ids = cards.map(
          (row) => row.id,
        );

        await tx
          .update(reportCards)
          .set({
            status: "headteacher_review",
            classTeacherSignedAt:
              new Date(),
          })
          .where(
            and(
              eq(
                reportCards.schoolId,
                school.id,
              ),
              eq(
                reportCards.publicationId,
                publicationId,
              ),
              eq(
                reportCards.status,
                "teacher_review",
              ),
              inArray(
                reportCards.id,
                ids,
              ),
            ),
          );

        return {
          success: true,
          message: `${ids.length} report card${
            ids.length === 1 ? "" : "s"
          } sent to headteacher review.`,
          count: ids.length,
        };
      },
    );

    revalidatePath(
      reportCardsPath(publicationId),
    );

    return result;
  } catch (error) {
    if (isNextRedirect(error)) {
      throw error;
    }

    console.error(
      "sendAllToHeadteacher failed:",
      error,
    );

    return {
      success: false,
      message:
        "Failed to send report cards to the headteacher.",
    };
  }
}

/*
 * ============================================================
 * APPROVE ONE
 * ============================================================
 */

export async function approveReportCard(
  reportCardId: string,
): Promise<ActionState> {
  try {
    const school = await requireCurrentSchool();

    const result = await db.transaction(
      async (tx) => {
        const [reportCard] = await tx
          .select({
            id: reportCards.id,
            status: reportCards.status,
            publicationId:
              reportCards.publicationId,
            publicationStatus:
              resultPublications.status,
          })
          .from(reportCards)
          .innerJoin(
            resultPublications,
            eq(
              resultPublications.id,
              reportCards.publicationId,
            ),
          )
          .where(
            and(
              eq(
                reportCards.id,
                reportCardId,
              ),
              eq(
                reportCards.schoolId,
                school.id,
              ),
            ),
          )
          .limit(1);

        if (!reportCard) {
          return {
            success: false,
            message: "Report card not found.",
          };
        }

        if (
          reportCard.publicationStatus !==
          "published"
        ) {
          return {
            success: false,
            message:
              "The associated results are not published.",
          };
        }

        if (
          reportCard.status ===
          "approved"
        ) {
          return {
            success: true,
            message:
              "Report card is already approved.",
            count: 0,
          };
        }

        if (
          reportCard.status !==
          "headteacher_review"
        ) {
          return {
            success: false,
            message:
              "Only report cards awaiting headteacher approval can be approved.",
          };
        }

        await tx
          .update(reportCards)
          .set({
            status: "approved",
            headteacherSignedAt:
              new Date(),
          })
          .where(
            eq(
              reportCards.id,
              reportCard.id,
            ),
          );

        return {
          success: true,
          message: "Report card approved.",
          count: 1,
        };
      },
    );

    revalidatePath(
      reportCardsPath(
        result.success
          ? ""
          : "unknown",
      ),
    );

    revalidatePath(
      "/assessments/results/published",
    );

    return result;
  } catch (error) {
    if (isNextRedirect(error)) {
      throw error;
    }

    console.error(
      "approveReportCard failed:",
      error,
    );

    return {
      success: false,
      message:
        "Failed to approve report card.",
    };
  }
}

/*
 * ============================================================
 * APPROVE SELECTED
 * ============================================================
 */

export async function approveSelectedReportCards(
  publicationId: string,
  reportCardIds: string[],
): Promise<ActionState> {
  try {
    const school = await requireCurrentSchool();

    const uniqueIds = [
      ...new Set(
        reportCardIds.filter(Boolean),
      ),
    ];

    if (uniqueIds.length === 0) {
      return {
        success: false,
        message: "No report cards were selected.",
      };
    }

    const result = await db.transaction(
      async (tx) => {
        const rows = await tx
          .select({
            id: reportCards.id,
            status: reportCards.status,
            publicationStatus:
              resultPublications.status,
          })
          .from(reportCards)
          .innerJoin(
            resultPublications,
            eq(
              resultPublications.id,
              reportCards.publicationId,
            ),
          )
          .where(
            and(
              eq(
                reportCards.schoolId,
                school.id,
              ),
              eq(
                reportCards.publicationId,
                publicationId,
              ),
              inArray(
                reportCards.id,
                uniqueIds,
              ),
            ),
          );

        if (rows.length !== uniqueIds.length) {
          return {
            success: false,
            message:
              "Some selected report cards could not be found.",
          };
        }

        const invalid = rows.filter(
          (row) =>
            row.publicationStatus !==
              "published" ||
            row.status !==
              "headteacher_review",
        );

        if (invalid.length > 0) {
          return {
            success: false,
            message: `${invalid.length} selected report card${
              invalid.length === 1
                ? ""
                : "s"
            } cannot be approved because they are not ready for headteacher approval.`,
          };
        }

        await tx
          .update(reportCards)
          .set({
            status: "approved",
            headteacherSignedAt:
              new Date(),
          })
          .where(
            and(
              eq(
                reportCards.schoolId,
                school.id,
              ),
              eq(
                reportCards.publicationId,
                publicationId,
              ),
              eq(
                reportCards.status,
                "headteacher_review",
              ),
              inArray(
                reportCards.id,
                uniqueIds,
              ),
            ),
          );

        return {
          success: true,
          message: `${uniqueIds.length} report card${
            uniqueIds.length === 1
              ? ""
              : "s"
          } approved.`,
          count: uniqueIds.length,
        };
      },
    );

    revalidatePath(
      reportCardsPath(publicationId),
    );

    revalidatePath(
      "/assessments/results/published",
    );

    return result;
  } catch (error) {
    if (isNextRedirect(error)) {
      throw error;
    }

    console.error(
      "approveSelectedReportCards failed:",
      error,
    );

    return {
      success: false,
      message:
        "Failed to approve selected report cards.",
    };
  }
}

/*
 * ============================================================
 * APPROVE ALL READY
 * ============================================================
 *
 * headteacher_review → approved
 *
 * ONE transaction.
 */

export async function approveAllReadyReportCards(
  publicationId: string,
): Promise<ActionState> {
  try {
    const school = await requireCurrentSchool();

    const result = await db.transaction(
      async (tx) => {
        const [publication] = await tx
          .select({
            id: resultPublications.id,
            status: resultPublications.status,
          })
          .from(resultPublications)
          .where(
            and(
              eq(
                resultPublications.id,
                publicationId,
              ),
              eq(
                resultPublications.schoolId,
                school.id,
              ),
            ),
          )
          .limit(1);

        if (!publication) {
          return {
            success: false,
            message:
              "Published result publication was not found.",
          };
        }

        if (publication.status !== "published") {
          return {
            success: false,
            message:
              "Only published results can have report cards approved.",
          };
        }

        const readyCards = await tx
          .select({
            id: reportCards.id,
          })
          .from(reportCards)
          .where(
            and(
              eq(
                reportCards.schoolId,
                school.id,
              ),
              eq(
                reportCards.publicationId,
                publication.id,
              ),
              eq(
                reportCards.status,
                "headteacher_review",
              ),
            ),
          );

        if (readyCards.length === 0) {
          return {
            success: true,
            message:
              "There are no report cards ready for approval.",
            count: 0,
          };
        }

        const ids = readyCards.map(
          (row) => row.id,
        );

        await tx
          .update(reportCards)
          .set({
            status: "approved",
            headteacherSignedAt:
              new Date(),
          })
          .where(
            and(
              eq(
                reportCards.schoolId,
                school.id,
              ),
              eq(
                reportCards.publicationId,
                publication.id,
              ),
              eq(
                reportCards.status,
                "headteacher_review",
              ),
              inArray(
                reportCards.id,
                ids,
              ),
            ),
          );

        return {
          success: true,
          message: `${ids.length} report card${
            ids.length === 1 ? "" : "s"
          } approved successfully.`,
          count: ids.length,
        };
      },
    );

    revalidatePath(
      reportCardsPath(publicationId),
    );

    revalidatePath(
      "/assessments/results/published",
    );

    return result;
  } catch (error) {
    if (isNextRedirect(error)) {
      throw error;
    }

    console.error(
      "approveAllReadyReportCards failed:",
      error,
    );

    return {
      success: false,
      message:
        "Failed to approve all ready report cards.",
    };
  }
}