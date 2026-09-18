"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import {
  reportCards,
  resultPublicationStudents,
  resultPublications,
} from "@/db/schema";
import { requireCurrentSchool } from "@/lib/current-school";

type ActionResult = {
  success: boolean;
  message: string;
};

const PROMOTION_STATUSES = [
  "pending",
  "promoted",
  "promoted_with_conditions",
  "repeated",
  "withdrawn",
  "transferred",
] as const;

type PromotionStatus =
  (typeof PROMOTION_STATUSES)[number];

function isPromotionStatus(
  value: string,
): value is PromotionStatus {
  return PROMOTION_STATUSES.includes(
    value as PromotionStatus,
  );
}

function reportCardsPath(publicationId: string) {
  return `/assessments/results/published/${publicationId}/report-cards`;
}

function individualReportCardPath(
  publicationId: string,
  studentSnapshotId: string,
) {
  return `/assessments/results/published/${publicationId}/students/${studentSnapshotId}/report-card`;
}

async function getOwnedPublishedReportCard(
  reportCardId: string,
) {
  const school = await requireCurrentSchool();

  const [row] = await db
    .select({
      reportCard: reportCards,
      publication: resultPublications,
      student: resultPublicationStudents,
    })
    .from(reportCards)
    .innerJoin(
      resultPublications,
      eq(
        reportCards.publicationId,
        resultPublications.id,
      ),
    )
    .innerJoin(
      resultPublicationStudents,
      eq(
        reportCards.publicationStudentId,
        resultPublicationStudents.id,
      ),
    )
    .where(
      and(
        eq(reportCards.id, reportCardId),
        eq(reportCards.schoolId, school.id),
        eq(resultPublications.schoolId, school.id),
        eq(resultPublications.status, "published"),
      ),
    )
    .limit(1);

  return row ?? null;
}

/* ================================================================
   SAVE CLASS TEACHER REMARK
   ================================================================ */

export async function saveClassTeacherRemark(
  reportCardId: string,
  remark: string,
): Promise<ActionResult> {
  try {
    const record =
      await getOwnedPublishedReportCard(
        reportCardId,
      );

    if (!record) {
      return {
        success: false,
        message: "Report card was not found.",
      };
    }

    if (
      record.reportCard.status === "approved"
    ) {
      return {
        success: false,
        message:
          "This report card has already been approved and is locked.",
      };
    }

    const cleanedRemark = remark.trim();

    if (cleanedRemark.length > 1000) {
      return {
        success: false,
        message:
          "Class teacher remark must not exceed 1,000 characters.",
      };
    }

    await db
      .update(reportCards)
      .set({
        classTeacherRemark:
          cleanedRemark || null,
        updatedAt: new Date(),
      })
      .where(
        eq(
          reportCards.id,
          reportCardId,
        ),
      );

    revalidatePath(
      reportCardsPath(
        record.publication.id,
      ),
    );

    revalidatePath(
      individualReportCardPath(
        record.publication.id,
        record.student.id,
      ),
    );

    return {
      success: true,
      message:
        "Class teacher remark saved successfully.",
    };
  } catch (error) {
    console.error(
      "saveClassTeacherRemark error:",
      error,
    );

    return {
      success: false,
      message:
        "Unable to save the class teacher remark.",
    };
  }
}

/* ================================================================
   SAVE HEADTEACHER REMARK
   ================================================================ */

export async function saveHeadteacherRemark(
  reportCardId: string,
  remark: string,
): Promise<ActionResult> {
  try {
    const record =
      await getOwnedPublishedReportCard(
        reportCardId,
      );

    if (!record) {
      return {
        success: false,
        message: "Report card was not found.",
      };
    }

    if (
      record.reportCard.status === "approved"
    ) {
      return {
        success: false,
        message:
          "This report card has already been approved and is locked.",
      };
    }

    const cleanedRemark = remark.trim();

    if (cleanedRemark.length > 1000) {
      return {
        success: false,
        message:
          "Headteacher remark must not exceed 1,000 characters.",
      };
    }

    await db
      .update(reportCards)
      .set({
        headteacherRemark:
          cleanedRemark || null,
        updatedAt: new Date(),
      })
      .where(
        eq(
          reportCards.id,
          reportCardId,
        ),
      );

    revalidatePath(
      reportCardsPath(
        record.publication.id,
      ),
    );

    revalidatePath(
      individualReportCardPath(
        record.publication.id,
        record.student.id,
      ),
    );

    return {
      success: true,
      message:
        "Headteacher remark saved successfully.",
    };
  } catch (error) {
    console.error(
      "saveHeadteacherRemark error:",
      error,
    );

    return {
      success: false,
      message:
        "Unable to save the headteacher remark.",
    };
  }
}

/* ================================================================
   SAVE PROMOTION STATUS
   ================================================================ */

export async function savePromotionStatus(
  reportCardId: string,
  promotionStatus: string,
): Promise<ActionResult> {
  try {
    const record =
      await getOwnedPublishedReportCard(
        reportCardId,
      );

    if (!record) {
      return {
        success: false,
        message: "Report card was not found.",
      };
    }

    if (
      record.reportCard.status === "approved"
    ) {
      return {
        success: false,
        message:
          "This report card has already been approved and is locked.",
      };
    }

    const cleanedStatus =
      promotionStatus.trim();

    if (!isPromotionStatus(cleanedStatus)) {
      return {
        success: false,
        message:
          "Invalid promotion status.",
      };
    }

    await db
      .update(reportCards)
      .set({
        promotionStatus: cleanedStatus,
        updatedAt: new Date(),
      })
      .where(
        eq(
          reportCards.id,
          reportCardId,
        ),
      );

    revalidatePath(
      reportCardsPath(
        record.publication.id,
      ),
    );

    revalidatePath(
      individualReportCardPath(
        record.publication.id,
        record.student.id,
      ),
    );

    return {
      success: true,
      message:
        "Promotion status saved successfully.",
    };
  } catch (error) {
    console.error(
      "savePromotionStatus error:",
      error,
    );

    return {
      success: false,
      message:
        "Unable to save the promotion status.",
    };
  }
}