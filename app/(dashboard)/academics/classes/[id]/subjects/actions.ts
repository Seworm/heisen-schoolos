"use server";

import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { db } from "@/db";
import {
  classLevels,
  classSubjects,
} from "@/db/schema";
import { requireCurrentSchool } from "@/lib/current-school";

type FormState = {
  error?: string;
};

export async function removeClassSubject(
  _previousState: FormState,
  formData: FormData,
): Promise<FormState> {
  const school = await requireCurrentSchool();

  const classId = String(
    formData.get("classId") ?? "",
  ).trim();

  const classSubjectId = String(
    formData.get("classSubjectId") ?? "",
  ).trim();

  if (!classId || !classSubjectId) {
    return {
      error: "Class and subject are required.",
    };
  }

  const [classLevel] = await db
    .select({
      id: classLevels.id,
    })
    .from(classLevels)
    .where(
      and(
        eq(classLevels.id, classId),
        eq(classLevels.schoolId, school.id),
      ),
    )
    .limit(1);

  if (!classLevel) {
    return {
      error: "Class not found.",
    };
  }

  const [classSubject] = await db
    .select({
      id: classSubjects.id,
    })
    .from(classSubjects)
    .where(
      and(
        eq(classSubjects.id, classSubjectId),
        eq(
          classSubjects.classLevelId,
          classId,
        ),
      ),
    )
    .limit(1);

  if (!classSubject) {
    return {
      error: "Curriculum subject not found.",
    };
  }

  try {
    await db
      .delete(classSubjects)
      .where(
        and(
          eq(
            classSubjects.id,
            classSubjectId,
          ),
          eq(
            classSubjects.classLevelId,
            classId,
          ),
        ),
      );
  } catch (error) {
    console.error(
      "Failed to remove class subject:",
      error,
    );

    return {
      error:
        "The subject could not be removed. Please try again.",
    };
  }

  redirect(
    `/academics/classes/${classId}/subjects`,
  );
}