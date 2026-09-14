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

export async function updateStream(
  _previousState: FormState,
  formData: FormData,
): Promise<FormState> {
  const school = await requireCurrentSchool();

  const streamId = String(
    formData.get("streamId") ?? "",
  ).trim();

  const classLevelId = String(
    formData.get("classLevelId") ?? "",
  ).trim();

  const name = String(
    formData.get("name") ?? "",
  ).trim();

  const capacityValue = String(
    formData.get("capacity") ?? "",
  ).trim();

  if (!streamId) {
    return {
      error: "Stream ID is required.",
    };
  }

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
      name: streams.name,
      capacity: streams.capacity,
    })
    .from(streams)
    .where(
      and(
        eq(streams.id, streamId),
        eq(streams.classLevelId, classLevelId),
      ),
    )
    .limit(1);

  if (!existingStream) {
    return {
      error: "Stream was not found.",
    };
  }

  const [duplicate] = await db
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

  if (
    duplicate &&
    duplicate.id !== streamId
  ) {
    return {
      error:
        "A stream with this name already exists in this class.",
    };
  }

  try {
    await db
      .update(streams)
      .set({
        name,
        capacity,
      })
      .where(
        and(
          eq(streams.id, streamId),
          eq(streams.classLevelId, classLevelId),
        ),
      );
  } catch (error) {
    console.error(
      "Failed to update stream:",
      error,
    );

    return {
      error:
        "The stream could not be updated. Please try again.",
    };
  }

  redirect(
    `/academics/classes/${classLevelId}`,
  );
}