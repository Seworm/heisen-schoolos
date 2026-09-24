"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { db } from "@/db";
import {
  announcements,
  announcementSmsDeliveries,
  classLevels,
  guardians,
  studentEnrollments,
  studentGuardians,
  studentPlacements,
  students,
  streams,
} from "@/db/schema";
import { requirePermission } from "@/lib/authorization";
import { getApplicationSession } from "@/lib/auth/compat";
import { requireCurrentSchool } from "@/lib/current-school";
import { createAnnouncementNotifications } from "@/lib/communications/recipients";
import { sendTransactionalSms } from "@/lib/sms";

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
  await requirePermission("communications.manage", school.id);

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
  const sendSms = formData.get("sendSms") === "on";

  if (expiresAt && expiresAt <= new Date()) {
    throw new Error("Expiry date must be in the future.");
  }

  return {
    title,
    body,
    audience: audienceValue,
    targetId,
    expiresAt,
    sendSms,
  };
}

async function sendAnnouncementSms(input: {
  schoolId: string;
  announcementId: string;
  audience: Audience;
  targetId: string | null;
  title: string;
  body: string;
  guardianIds?: string[];
}) {
  if (
    !["parents", "class", "stream"].includes(input.audience) ||
    !input.targetId
  ) {
    throw new Error("SMS announcements require a selected parent, class, or stream target.");
  }

  const allGuardianTargets = input.audience === "parents"
    ? await db
        .select({ id: guardians.id, phone: guardians.phone })
        .from(guardians)
        .where(and(eq(guardians.id, input.targetId!), eq(guardians.schoolId, input.schoolId)))
    : await db
        .selectDistinct({ id: guardians.id, phone: guardians.phone })
        .from(studentGuardians)
        .innerJoin(guardians, eq(guardians.id, studentGuardians.guardianId))
        .innerJoin(students, eq(students.id, studentGuardians.studentId))
        .innerJoin(studentEnrollments, eq(studentEnrollments.studentId, students.id))
        .innerJoin(studentPlacements, eq(studentPlacements.studentEnrollmentId, studentEnrollments.id))
        .innerJoin(streams, eq(streams.id, studentPlacements.streamId))
        .where(and(
          eq(guardians.schoolId, input.schoolId),
          eq(students.schoolId, input.schoolId),
          eq(studentEnrollments.status, "active"),
          eq(studentPlacements.status, "active"),
          input.audience === "class"
            ? eq(streams.classLevelId, input.targetId!)
            : eq(streams.id, input.targetId!),
        ));
  const guardianTargets = input.guardianIds
    ? allGuardianTargets.filter((guardian) =>
        input.guardianIds?.includes(guardian.id),
      )
    : allGuardianTargets;

  if (guardianTargets.length === 0) {
    throw new Error("No guardians with phone numbers were found for this announcement target.");
  }

  const failures: string[] = [];
  let delivered = 0;
  for (const guardian of guardianTargets) {
    if (!guardian.phone) {
      failures.push("A selected guardian has no phone number.");
      continue;
    }
    const attemptedAt = new Date();
    try {
      const delivery = await sendTransactionalSms({
        recipient: guardian.phone,
        content: `${input.title}: ${input.body}`,
      });
      await db.insert(announcementSmsDeliveries).values({
        schoolId: input.schoolId,
        announcementId: input.announcementId,
        guardianId: guardian.id,
        recipient: delivery.recipient,
        status: "sent",
        providerMessageId: delivery.messageId == null ? null : String(delivery.messageId),
        attemptedAt,
      });
      delivered += 1;
    } catch (error) {
      const message = error instanceof Error ? error.message : "SMS delivery failed.";
      failures.push(message);
      await db.insert(announcementSmsDeliveries).values({
        schoolId: input.schoolId,
        announcementId: input.announcementId,
        guardianId: guardian.id,
        recipient: guardian.phone,
        status: "failed",
        errorMessage: message,
        attemptedAt,
      });
    }
  }

  if (delivered > 0) {
    await db.update(announcements)
      .set({ smsSentAt: new Date(), updatedAt: new Date() })
      .where(and(eq(announcements.id, input.announcementId), eq(announcements.schoolId, input.schoolId)));
  }
  if (failures.length > 0) {
    throw new Error(`SMS sent to ${delivered} recipient(s); ${failures.length} delivery attempt(s) failed.`);
  }
}

export async function retryAnnouncementSms(id: string) {
  const { school } = await getContext();
  const [announcement] = await db.select().from(announcements).where(and(eq(announcements.id, id), eq(announcements.schoolId, school.id))).limit(1);
  if (!announcement?.publishedAt) throw new Error("Only published announcements can send SMS.");
  const attempts = await db
    .select({
      guardianId: announcementSmsDeliveries.guardianId,
      status: announcementSmsDeliveries.status,
      attemptedAt: announcementSmsDeliveries.attemptedAt,
    })
    .from(announcementSmsDeliveries)
    .where(
      and(
        eq(announcementSmsDeliveries.announcementId, announcement.id),
        eq(announcementSmsDeliveries.schoolId, school.id),
      ),
    )
    .orderBy(announcementSmsDeliveries.attemptedAt);
  const latestByGuardian = new Map<string, string>();
  for (const attempt of attempts) {
    latestByGuardian.set(attempt.guardianId, attempt.status);
  }
  const failedGuardianIds = [...latestByGuardian.entries()]
    .filter(([, status]) => status === "failed")
    .map(([guardianId]) => guardianId);
  if (failedGuardianIds.length === 0) {
    throw new Error("There are no failed SMS deliveries to retry.");
  }
  await sendAnnouncementSms({
    schoolId: school.id,
    announcementId: announcement.id,
    audience: announcement.audience,
    targetId: announcement.targetId,
    title: announcement.title,
    body: announcement.body,
    guardianIds: failedGuardianIds,
  });
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
      if (data.sendSms) {
        await sendAnnouncementSms({
          schoolId: school.id,
          announcementId: announcement.id,
          audience: data.audience,
          targetId,
          title: data.title,
          body: data.body,
        });
      }
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