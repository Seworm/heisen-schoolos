"use server";

import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { db } from "@/db";
import {
  classLevels,
  classSubjects,
  subjects,
} from "@/db/schema";
import { requireCurrentSchool } from "@/lib/current-school";

type FormState = {
  error?: string;
};

export async function addClassSubject(
  _previousState: FormState,
  formData: FormData,
): Promise<FormState> {
  const school = await requireCurrentSchool();

  const classId = String(
    formData.get("classId") ?? "",
  ).trim();

  const subjectId = String(
    formData.get("subjectId") ?? "",
  ).trim();

  if (!classId || !subjectId) {
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

  const [subject] = await db
    .select({
      id: subjects.id,
    })
    .from(subjects)
    .where(
      and(
        eq(subjects.id, subjectId),
        eq(subjects.schoolId, school.id),
      ),
    )
    .limit(1);

  if (!subject) {
    return {
      error: "Subject not found.",
    };
  }

  const [existing] = await db
    .select({
      id: classSubjects.id,
    })
    .from(classSubjects)
    .where(
      and(
        eq(
          classSubjects.classLevelId,
          classId,
        ),
        eq(
          classSubjects.subjectId,
          subjectId,
        ),
      ),
    )
    .limit(1);

  if (existing) {
    return {
      error:
        "This subject is already offered to this class.",
    };
  }

  try {
    await db.insert(classSubjects).values({
      classLevelId: classId,
      subjectId,
    });
  } catch (error) {
    console.error(
      "Failed to add class subject:",
      error,
    );

    return {
      error:
        "The subject could not be added. Please try again.",
    };
  }

  redirect(
    `/academics/classes/${classId}/subjects`,
  );
}