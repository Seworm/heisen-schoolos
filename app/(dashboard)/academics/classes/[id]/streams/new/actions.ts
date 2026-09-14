"use server";

import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { db } from "@/db";
import {
  classLevels,
  streams,
} from "@/db/schema";
import { requireCurrentSchool } from "@/lib/current-school";

type FormState = {
  error?: string;
};

export async function createStream(
  _previousState: FormState,
  formData: FormData,
): Promise<FormState> {
  const school = await requireCurrentSchool();

  const classLevelId = String(
    formData.get("classLevelId") ?? "",
  ).trim();

  const name = String(
    formData.get("name") ?? "",
  ).trim();

  const capacityValue = String(
    formData.get("capacity") ?? "",
  ).trim();

  if (!classLevelId) {
    return {
      error: "Class level is required.",
    };
  }

  if (!name) {
    return {
      error: "Stream name is required.",
    };
  }

  const capacity = Number(capacityValue);

  if (
    !Number.isInteger(capacity) ||
    capacity < 1 ||
    capacity > 1000
  ) {
    return {
      error:
        "Capacity must be a whole number between 1 and 1000.",
    };
  }

  const [classLevel] = await db
    .select({
      id: classLevels.id,
      name: classLevels.name,
    })
    .from(classLevels)
    .where(
      and(
        eq(classLevels.id, classLevelId),
        eq(classLevels.schoolId, school.id),
      ),
    )
    .limit(1);

  if (!classLevel) {
    return {
      error: "Class level was not found.",
    };
  }

  const [existingStream] = await db
    .select({
      id: streams.id,
    })
    .from(streams)
    .where(
      and(
        eq(streams.classLevelId, classLevelId),
        eq(streams.name, name),
      ),
    )
    .limit(1);

  if (existingStream) {
    return {
      error:
        "A stream with this name already exists in this class.",
    };
  }

  try {
    await db.insert(streams).values({
      classLevelId,
      name,
      capacity,
    });
  } catch (error) {
    console.error(
      "Failed to create stream:",
      error,
    );

    return {
      error:
        "The stream could not be created. Please try again.",
    };
  }

  redirect(`/academics/classes/${classLevelId}`);
}