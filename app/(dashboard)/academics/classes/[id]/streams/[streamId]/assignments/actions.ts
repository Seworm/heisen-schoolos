"use server";

import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { db } from "@/db";
import {
  classLevels,
  streams,
  teacherAssignments,
} from "@/db/schema";
import { requireCurrentSchool } from "@/lib/current-school";

type FormState = {
  error?: string;
};

export async function deleteStreamAssignment(
  _previousState: FormState,
  formData: FormData,
): Promise<FormState> {
  const school = await requireCurrentSchool();

  const classId = String(
    formData.get("classId") ?? "",
  ).trim();

  const streamId = String(
    formData.get("streamId") ?? "",
  ).trim();

  const assignmentId = String(
    formData.get("assignmentId") ?? "",
  ).trim();

  if (!classId || !streamId || !assignmentId) {
    return {
      error:
        "Class, stream and assignment are required.",
    };
  }

  /*
   * Verify that the stream belongs to the current school
   * and the supplied class.
   */
  const [stream] = await db
    .select({
      id: streams.id,
      classLevelId: streams.classLevelId,
    })
    .from(streams)
    .innerJoin(
      classLevels,
      eq(streams.classLevelId, classLevels.id),
    )
    .where(
      and(
        eq(streams.id, streamId),
        eq(streams.classLevelId, classId),
        eq(classLevels.schoolId, school.id),
      ),
    )
    .limit(1);

  if (!stream) {
    return {
      error: "Stream not found.",
    };
  }

  /*
   * Verify that the assignment belongs to this
   * stream before deleting it.
   */
  const [assignment] = await db
    .select({
      id: teacherAssignments.id,
    })
    .from(teacherAssignments)
    .where(
      and(
        eq(
          teacherAssignments.id,
          assignmentId,
        ),
        eq(
          teacherAssignments.streamId,
          streamId,
        ),
      ),
    )
    .limit(1);

  if (!assignment) {
    return {
      error: "Teaching assignment not found.",
    };
  }

  try {
    await db
      .delete(teacherAssignments)
      .where(
        and(
          eq(
            teacherAssignments.id,
            assignmentId,
          ),
          eq(
            teacherAssignments.streamId,
            streamId,
          ),
        ),
      );
  } catch (error) {
    console.error(
      "Failed to delete teaching assignment:",
      error,
    );

    return {
      error:
        "The teaching assignment could not be deleted. Please try again.",
    };
  }

  redirect(
    `/academics/classes/${classId}/streams/${streamId}`,
  );
}