"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { db } from "@/db";
import {
  announcements,
  classLevels,
  guardians,
  students,
  streams,
} from "@/db/schema";
import { getApplicationSession } from "@/lib/auth/compat";
import { requireCurrentSchool } from "@/lib/current-school";
import { createAnnouncementNotifications } from "@/lib/communications/recipients";

const AUDIENCES = [
  "school",
  "class",
  "stream",
  "staff",
  "parents",
  "students",
  "individual",
] as const;

type Audience = (typeof AUDIENCES)[number];

type ActionState = {
  error?: string;
} | null;

function isAudience(value: string): value is Audience {
  return AUDIENCES.includes(value as Audience);
}

function parseDate(value: FormDataEntryValue | null): Date | null {
  if (!value || typeof value !== "string" || !value.trim()) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error("Invalid expiry date.");
  }

  return date;
}

async function getContext() {
  const session = await getApplicationSession();

  if (!session?.user) {
    throw new Error("You must be signed in.");
  }

  if (session.user.accountType !== "staff") {
    throw new Error("Only school staff can manage communications.");
  }

  const school = await requireCurrentSchool();

  if (session.user.schoolId !== school.id) {
    throw new Error("You do not have access to this school.");
  }

  return {
    session,
    school,
  };
}

async function validateTarget(
  schoolId: string,
  audience: Audience,
  targetId: string | null,
): Promise<string | null> {
  const requiresTarget =
    audience === "class" ||
    audience === "stream" ||
    audience === "parents" ||
    audience === "individual";

  if (requiresTarget && !targetId) {
    throw new Error("Please select a target.");
  }

  if (!requiresTarget) {
    return null;
  }

  if (audience === "class") {
    const [target] = await db
      .select({
        id: classLevels.id,
      })
      .from(classLevels)
      .where(
        and(
          eq(classLevels.id, targetId!),
          eq(classLevels.schoolId, schoolId),
        ),
      )
      .limit(1);

    if (!target) {
      throw new Error("Selected class was not found.");
    }

    return target.id;
  }

  if (audience === "stream") {
    const [target] = await db
      .select({
        id: streams.id,
      })
      .from(streams)
      .innerJoin(
        classLevels,
        eq(classLevels.id, streams.classLevelId),
      )
      .where(
        and(
          eq(streams.id, targetId!),
          eq(classLevels.schoolId, schoolId),
        ),
      )
      .limit(1);

    if (!target) {
      throw new Error("Selected stream was not found.");
    }

    return target.id;
  }

  if (audience === "parents") {
    const [target] = await db
      .select({
        id: guardians.id,
      })
      .from(guardians)
      .where(
        and(
          eq(guardians.id, targetId!),
          eq(guardians.schoolId, schoolId),
        ),
      )
      .limit(1);

    if (!target) {
      throw new Error("Selected parent/guardian was not found.");
    }

    return target.id;
  }

  const [target] = await db
    .select({
      id: students.id,
    })
    .from(students)
    .where(
      and(
        eq(students.id, targetId!),
        eq(students.schoolId, schoolId),
      ),
    )
    .limit(1);

  if (!target) {
    throw new Error("Selected student was not found.");
  }

  return target.id;
}

async function parseAnnouncement(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const audienceValue = String(formData.get("audience") ?? "");
  const targetValue = String(formData.get("targetId") ?? "").trim();

  if (!title) {
    throw new Error("Title is required.");
  }

  if (title.length > 200) {
    throw new Error("Title cannot exceed 200 characters.");
  }

  if (!body) {
    throw new Error("Message body is required.");
  }

  if (!isAudience(audienceValue)) {
    throw new Error("Invalid announcement audience.");
  }

  const targetId = targetValue || null;
  const expiresAt = parseDate(formData.get("expiresAt"));

  if (expiresAt && expiresAt <= new Date()) {
    throw new Error("Expiry date must be in the future.");
  }

  return {
    title,
    body,
    audience: audienceValue,
    targetId,
    expiresAt,
  };
}

export async function createAnnouncement(
  _previousState: ActionState,
  formData: FormData,
) {
  try {
    const { session, school } = await getContext();

    const data = await parseAnnouncement(formData);

    const targetId = await validateTarget(
      school.id,
      data.audience,
      data.targetId,
    );

    const action = String(formData.get("action") ?? "draft");

    const shouldPublish = action === "publish";
    const publishedAt = shouldPublish ? new Date() : null;

    if (
      publishedAt &&
      data.expiresAt &&
      data.expiresAt <= publishedAt
    ) {
      throw new Error("Expiry date must be after publication.");
    }

    const now = new Date();

    const [announcement] = await db
      .insert(announcements)
      .values({
        schoolId: school.id,
        authorId: session.user.authUserId!,
        title: data.title,
        body: data.body,
        audience: data.audience,
        targetId,
        publishedAt,
        expiresAt: data.expiresAt,
        createdAt: now,
        updatedAt: now,
      })
      .returning({
        id: announcements.id,
      });

    if (!announcement) {
      throw new Error("Unable to create announcement.");
    }

    if (publishedAt) {
      await createAnnouncementNotifications({
        schoolId: school.id,
        title: data.title,
        body: data.body,
        audience: data.audience,
        targetId,
      });
    }

    revalidatePath("/communications");

    redirect(`/communications/${announcement.id}`);
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Unable to create announcement.",
    };
  }
}

export async function updateAnnouncement(
  _previousState: ActionState,
  formData: FormData,
) {
  try {
    const { school } = await getContext();

    const id = String(formData.get("id") ?? "").trim();

    if (!id) {
      throw new Error("Announcement ID is required.");
    }

    const data = await parseAnnouncement(formData);

    const targetId = await validateTarget(
      school.id,
      data.audience,
      data.targetId,
    );

    const [existing] = await db
      .select({
        id: announcements.id,
        publishedAt: announcements.publishedAt,
      })
      .from(announcements)
      .where(
        and(
          eq(announcements.id, id),
          eq(announcements.schoolId, school.id),
        ),
      )
      .limit(1);

    if (!existing) {
      throw new Error("Announcement not found.");
    }

    if (
      existing.publishedAt &&
      data.expiresAt &&
      data.expiresAt <= existing.publishedAt
    ) {
      throw new Error("Expiry date must be after publication.");
    }

    await db
      .update(announcements)
      .set({
        title: data.title,
        body: data.body,
        audience: data.audience,
        targetId,
        expiresAt: data.expiresAt,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(announcements.id, id),
          eq(announcements.schoolId, school.id),
        ),
      );

    revalidatePath("/communications");
    revalidatePath(`/communications/${id}`);
    revalidatePath(`/communications/${id}/edit`);

    redirect(`/communications/${id}`);
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Unable to update announcement.",
    };
  }
}

export async function publishAnnouncement(id: string) {
  const { school } = await getContext();

  const [announcement] = await db
    .select({
      id: announcements.id,
      title: announcements.title,
      body: announcements.body,
      audience: announcements.audience,
      targetId: announcements.targetId,
      publishedAt: announcements.publishedAt,
      expiresAt: announcements.expiresAt,
    })
    .from(announcements)
    .where(
      and(
        eq(announcements.id, id),
        eq(announcements.schoolId, school.id),
      ),
    )
    .limit(1);

  if (!announcement) {
    throw new Error("Announcement not found.");
  }

  if (announcement.publishedAt) {
    throw new Error("This announcement is already published.");
  }

  const now = new Date();

  if (announcement.expiresAt && announcement.expiresAt <= now) {
    throw new Error(
      "Cannot publish an announcement that has already expired.",
    );
  }

  await db
    .update(announcements)
    .set({
      publishedAt: now,
      updatedAt: now,
    })
    .where(
      and(
        eq(announcements.id, id),
        eq(announcements.schoolId, school.id),
      ),
    );

  await createAnnouncementNotifications({
    schoolId: school.id,
    title: announcement.title,
    body: announcement.body,
    audience: announcement.audience,
    targetId: announcement.targetId,
  });

  revalidatePath("/communications");
  revalidatePath(`/communications/${id}`);

  redirect(`/communications/${id}`);
}

export async function unpublishAnnouncement(id: string) {
  const { school } = await getContext();

  const [announcement] = await db
    .select({
      id: announcements.id,
      publishedAt: announcements.publishedAt,
    })
    .from(announcements)
    .where(
      and(
        eq(announcements.id, id),
        eq(announcements.schoolId, school.id),
      ),
    )
    .limit(1);

  if (!announcement) {
    throw new Error("Announcement not found.");
  }

  if (!announcement.publishedAt) {
    throw new Error("This announcement is not published.");
  }

  await db
    .update(announcements)
    .set({
      publishedAt: null,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(announcements.id, id),
        eq(announcements.schoolId, school.id),
      ),
    );

  revalidatePath("/communications");
  revalidatePath(`/communications/${id}`);

  redirect(`/communications/${id}`);
}

export async function deleteAnnouncement(id: string) {
  const { school } = await getContext();

  const [announcement] = await db
    .select({
      id: announcements.id,
    })
    .from(announcements)
    .where(
      and(
        eq(announcements.id, id),
        eq(announcements.schoolId, school.id),
      ),
    )
    .limit(1);

  if (!announcement) {
    throw new Error("Announcement not found.");
  }

  await db
    .delete(announcements)
    .where(
      and(
        eq(announcements.id, id),
        eq(announcements.schoolId, school.id),
      ),
    );

  revalidatePath("/communications");

  redirect("/communications");
}
