import { and, eq, sql } from "drizzle-orm";

import { db } from "@/db";
import {
  academicYears,
  classLevels,
  studentEnrollments,
  studentPlacements,
  students,
  streams,
} from "@/db/schema";
import { requireCurrentSchool } from "@/lib/current-school";

type TransferPlacementInput = {
  studentId: string;
  enrollmentId: string;
  destinationStreamId: string;
  transferDate: string;
};

type TransferPlacementResult =
  | {
      success: true;
      placementId: string;
    }
  | {
      success: false;
      error: string;
    };

export async function transferStudentPlacement(
  input: TransferPlacementInput,
): Promise<TransferPlacementResult> {
  const {
    studentId,
    enrollmentId,
    destinationStreamId,
    transferDate,
  } = input;

  // ------------------------------------------------------------
  // 1. Validate required input
  // ------------------------------------------------------------

  if (!studentId || !enrollmentId || !destinationStreamId) {
    return {
      success: false,
      error: "Student, enrollment and destination stream are required.",
    };
  }

  if (!transferDate) {
    return {
      success: false,
      error: "Transfer date is required.",
    };
  }

  // ------------------------------------------------------------
  // 2. Validate transfer date format
  // ------------------------------------------------------------

  const parsedTransferDate = new Date(`${transferDate}T00:00:00`);

  if (Number.isNaN(parsedTransferDate.getTime())) {
    return {
      success: false,
      error: "Invalid transfer date.",
    };
  }

  const school = await requireCurrentSchool();

  try {
    const result = await db.transaction(async (tx) => {
      // ----------------------------------------------------------
      // 3. Validate enrollment and student
      // ----------------------------------------------------------

      const [enrollment] = await tx
        .select({
          enrollmentId: studentEnrollments.id,
          studentId: studentEnrollments.studentId,
          academicYearId: studentEnrollments.academicYearId,
          enrollmentStatus: studentEnrollments.status,
          schoolId: academicYears.schoolId,
        })
        .from(studentEnrollments)
        .innerJoin(
          academicYears,
          eq(
            studentEnrollments.academicYearId,
            academicYears.id,
          ),
        )
        .where(
          and(
            eq(studentEnrollments.id, enrollmentId),
            eq(studentEnrollments.studentId, studentId),
            eq(academicYears.schoolId, school.id),
          ),
        )
        .limit(1);

      if (!enrollment) {
        throw new Error(
          "The enrollment was not found in the current school.",
        );
      }

      if (enrollment.enrollmentStatus !== "active") {
        throw new Error(
          "Only an active enrollment can be transferred.",
        );
      }

      // ----------------------------------------------------------
      // 4. Validate destination stream
      // ----------------------------------------------------------

      const [destination] = await tx
        .select({
          streamId: streams.id,
          streamName: streams.name,
          capacity: streams.capacity,
          classLevelId: classLevels.id,
          className: classLevels.name,
          schoolId: classLevels.schoolId,
        })
        .from(streams)
        .innerJoin(
          classLevels,
          eq(streams.classLevelId, classLevels.id),
        )
        .where(
          and(
            eq(streams.id, destinationStreamId),
            eq(classLevels.schoolId, school.id),
          ),
        )
        .limit(1);

      if (!destination) {
        throw new Error(
          "The destination stream was not found in the current school.",
        );
      }

      // ----------------------------------------------------------
      // 5. Lock destination stream
      //
      // This serializes simultaneous transfers into the same
      // stream so two students cannot consume the same final slot.
      // ----------------------------------------------------------

      await tx.execute(
        sql`SELECT pg_advisory_xact_lock(
          hashtext(
            ${`heisen-schoolos:placement:${destination.streamId}:${enrollment.academicYearId}`}
          )
        )`,
      );

      // ----------------------------------------------------------
      // 6. Find current active placement
      // ----------------------------------------------------------

      const [currentPlacement] = await tx
        .select({
          id: studentPlacements.id,
          streamId: studentPlacements.streamId,
          startDate: studentPlacements.startDate,
        })
        .from(studentPlacements)
        .where(
          and(
            eq(
              studentPlacements.studentEnrollmentId,
              enrollment.enrollmentId,
            ),
            eq(studentPlacements.status, "active"),
          ),
        )
        .limit(1);

      if (!currentPlacement) {
        throw new Error(
          "This enrollment does not have an active placement.",
        );
      }

      // ----------------------------------------------------------
      // 7. Prevent transfer to the same stream
      // ----------------------------------------------------------

      if (currentPlacement.streamId === destination.streamId) {
        throw new Error(
          "The student is already assigned to this stream.",
        );
      }

      // ----------------------------------------------------------
      // 8. Validate transfer date against current placement
      // ----------------------------------------------------------

      if (transferDate < currentPlacement.startDate) {
        throw new Error(
          "Transfer date cannot be earlier than the current placement start date.",
        );
      }

      // ----------------------------------------------------------
      // 9. Check destination capacity
      // ----------------------------------------------------------

      const [capacityResult] = await tx
        .select({
          count: sql<number>`count(*)`,
        })
        .from(studentPlacements)
        .innerJoin(
          studentEnrollments,
          eq(
            studentPlacements.studentEnrollmentId,
            studentEnrollments.id,
          ),
        )
        .where(
          and(
            eq(
              studentPlacements.streamId,
              destination.streamId,
            ),
            eq(studentPlacements.status, "active"),
            eq(
              studentEnrollments.academicYearId,
              enrollment.academicYearId,
            ),
          ),
        );

      const occupied = Number(capacityResult?.count ?? 0);

      if (
        destination.capacity !== null &&
        occupied >= destination.capacity
      ) {
        throw new Error(
          `${destination.className} ${destination.streamName} is full.`,
        );
      }

      // ----------------------------------------------------------
      // 10. Close current placement
      // ----------------------------------------------------------

      await tx
        .update(studentPlacements)
        .set({
          status: "transferred",
          endDate: transferDate,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(studentPlacements.id, currentPlacement.id),
            eq(studentPlacements.status, "active"),
          ),
        );

      // ----------------------------------------------------------
      // 11. Create new active placement
      // ----------------------------------------------------------

      const [newPlacement] = await tx
        .insert(studentPlacements)
        .values({
          studentEnrollmentId: enrollment.enrollmentId,
          streamId: destination.streamId,
          startDate: transferDate,
          status: "active",
        })
        .returning({
          id: studentPlacements.id,
        });

      if (!newPlacement) {
        throw new Error(
          "The new placement could not be created.",
        );
      }

      // ----------------------------------------------------------
      // 12. Return new placement
      // ----------------------------------------------------------

      return newPlacement;
    });

    return {
      success: true,
      placementId: result.id,
    };
  } catch (error) {
    console.error("Placement transfer failed:", error);

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "The placement transfer failed. No changes were saved.",
    };
  }
}
