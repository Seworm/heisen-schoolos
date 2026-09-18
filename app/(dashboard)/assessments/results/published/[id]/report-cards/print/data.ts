import { and, asc, eq, inArray } from "drizzle-orm";

import { db } from "@/db";
import {
  academicYears,
  classLevels,
  reportCards,
  resultPublicationAssessments,
  resultPublicationStudents,
  resultPublicationSubjects,
  resultPublications,
  streams,
  terms,
} from "@/db/schema";
import { requireCurrentSchool } from "@/lib/current-school";

export type ApprovedReportCardRow = {
  reportCardId: string;
  reportCardStatus: string;

  studentSnapshotId: string;
  studentId: string;

  firstName: string;
  middleName: string | null;
  lastName: string;

  studentNumber: string;

  overallPercentage: number;
  overallPosition: number;

  classTeacherRemark: string | null;
  headteacherRemark: string | null;
  promotionStatus: string | null;

  classTeacherSignedAt: Date | null;
  headteacherSignedAt: Date | null;
};

export async function getApprovedReportCards(
  publicationId: string,
) {
  const school = await requireCurrentSchool();

  /*
   * ------------------------------------------------------------
   * 1. Load the published result publication and its
   *    academic context.
   * ------------------------------------------------------------
   */

  const [publication] = await db
    .select({
      id: resultPublications.id,
      schoolId: resultPublications.schoolId,

      academicYearId:
        resultPublications.academicYearId,

      termId:
        resultPublications.termId,

      streamId:
        resultPublications.streamId,

      gradingSchemeId:
        resultPublications.gradingSchemeId,

      status:
        resultPublications.status,

      publishedAt:
        resultPublications.publishedAt,

      academicYearName:
        academicYears.name,

      termName:
        terms.name,

      className:
        classLevels.name,

      classCategory:
        classLevels.category,

      streamName:
        streams.name,
    })
    .from(resultPublications)
    .innerJoin(
      academicYears,
      eq(
        resultPublications.academicYearId,
        academicYears.id,
      ),
    )
    .innerJoin(
      terms,
      eq(
        resultPublications.termId,
        terms.id,
      ),
    )
    .innerJoin(
      streams,
      eq(
        resultPublications.streamId,
        streams.id,
      ),
    )
    .innerJoin(
      classLevels,
      eq(
        streams.classLevelId,
        classLevels.id,
      ),
    )
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

        eq(
          resultPublications.status,
          "published",
        ),
      ),
    )
    .limit(1);

  if (!publication) {
    throw new Error(
      "Published result publication was not found.",
    );
  }

  /*
   * ------------------------------------------------------------
   * 2. Load ONLY approved report cards.
   *
   *    This is deliberately restricted to:
   *
   *      reportCards.status = approved
   *
   *    Therefore draft, teacher_review and
   *    headteacher_review cards can never enter the
   *    batch-print dataset.
   * ------------------------------------------------------------
   */

  const rows = await db
    .select({
      reportCardId:
        reportCards.id,

      reportCardStatus:
        reportCards.status,

      studentSnapshotId:
        resultPublicationStudents.id,

      studentId:
        resultPublicationStudents.studentId,

      firstName:
        resultPublicationStudents.firstName,

      middleName:
        resultPublicationStudents.middleName,

      lastName:
        resultPublicationStudents.lastName,

      studentNumber:
        resultPublicationStudents.studentNumber,

      overallPercentage:
        resultPublicationStudents.overallPercentage,

      overallPosition:
        resultPublicationStudents.position,

      classTeacherRemark:
        reportCards.classTeacherRemark,

      headteacherRemark:
        reportCards.headteacherRemark,

      promotionStatus:
        reportCards.promotionStatus,

      classTeacherSignedAt:
        reportCards.classTeacherSignedAt,

      headteacherSignedAt:
        reportCards.headteacherSignedAt,
    })
    .from(reportCards)
    .innerJoin(
      resultPublicationStudents,
      eq(
        reportCards.publicationStudentId,
        resultPublicationStudents.id,
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

        eq(
          reportCards.status,
          "approved",
        ),
      ),
    )
    .orderBy(
      asc(
        resultPublicationStudents.position,
      ),

      asc(
        resultPublicationStudents.studentNumber,
      ),
    );

  /*
   * ------------------------------------------------------------
   * 3. Collect the immutable publication-student snapshot IDs.
   * ------------------------------------------------------------
   */

  const publicationStudentIds = rows.map(
    (row) => row.studentSnapshotId,
  );

  /*
   * ------------------------------------------------------------
   * 4. Load all published subject snapshots for the
   *    approved students in ONE query.
   * ------------------------------------------------------------
   */

  const subjects =
    publicationStudentIds.length > 0
      ? await db
          .select()
          .from(resultPublicationSubjects)
          .where(
            inArray(
              resultPublicationSubjects.publicationStudentId,
              publicationStudentIds,
            ),
          )
          .orderBy(
            asc(
              resultPublicationSubjects.position,
            ),

            asc(
              resultPublicationSubjects.subjectName,
            ),
          )
      : [];

  /*
   * ------------------------------------------------------------
   * 5. Collect subject snapshot IDs.
   * ------------------------------------------------------------
   */

  const subjectIds = subjects.map(
    (subject) => subject.id,
  );

  /*
   * ------------------------------------------------------------
   * 6. Load all published assessment snapshots in ONE query.
   *
   *    These are the immutable assessment-level values that
   *    belong to the published result.
   * ------------------------------------------------------------
   */

  const assessments =
    subjectIds.length > 0
      ? await db
          .select()
          .from(
            resultPublicationAssessments,
          )
          .where(
            inArray(
              resultPublicationAssessments.publicationSubjectId,
              subjectIds,
            ),
          )
          .orderBy(
            asc(
              resultPublicationAssessments.assessmentName,
            ),
          )
      : [];

  /*
   * ------------------------------------------------------------
   * 7. Return the complete immutable academic snapshot plus
   *    approved report-card workflow metadata.
   * ------------------------------------------------------------
   */

  return {
    school,

    publication,

    rows,

    subjects,

    assessments,
  };
}
