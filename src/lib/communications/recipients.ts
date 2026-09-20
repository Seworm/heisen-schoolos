import { and, eq, inArray } from "drizzle-orm";

import { db } from "@/db";
import {
  classLevels,
  guardians,
  notifications,
  profiles,
  schoolMemberships,
  studentGuardians,
  studentUserAccounts,
  students,
  streams,
  users,
} from "@/db/schema";

type Audience =
  | "school"
  | "class"
  | "stream"
  | "staff"
  | "parents"
  | "students"
  | "individual";

type AnnouncementRecipient = {
  authUserId: string;
  email: string;
};

async function uniqueRecipients(
  recipients: AnnouncementRecipient[],
) {
  const seen = new Set<string>();

  return recipients.filter((recipient) => {
    if (seen.has(recipient.authUserId)) {
      return false;
    }

    seen.add(recipient.authUserId);
    return true;
  });
}

async function getStudentRecipients(
  schoolId: string,
  studentIds: string[],
) {
  if (studentIds.length === 0) {
    return [];
  }

  const accounts = await db
    .select({
      authUserId: profiles.authUserId,
      email: profiles.email,
    })
    .from(studentUserAccounts)
    .innerJoin(
      profiles,
      eq(profiles.email, studentUserAccounts.email),
    )
    .innerJoin(
      students,
      eq(students.id, studentUserAccounts.studentId),
    )
    .where(
      and(
        eq(students.schoolId, schoolId),
        inArray(studentUserAccounts.studentId, studentIds),
        eq(studentUserAccounts.status, "active"),
      ),
    );

  return accounts;
}

async function getAllStudentRecipients(schoolId: string) {
  const rows = await db
    .select({
      authUserId: profiles.authUserId,
      email: profiles.email,
    })
    .from(studentUserAccounts)
    .innerJoin(
      profiles,
      eq(profiles.email, studentUserAccounts.email),
    )
    .innerJoin(
      students,
      eq(students.id, studentUserAccounts.studentId),
    )
    .where(
      and(
        eq(students.schoolId, schoolId),
        eq(studentUserAccounts.status, "active"),
      ),
    );

  return rows;
}

async function getStaffRecipients(schoolId: string) {
  const rows = await db
    .select({
      authUserId: profiles.authUserId,
      email: profiles.email,
    })
    .from(schoolMemberships)
    .innerJoin(users, eq(users.id, schoolMemberships.userId))
    .innerJoin(profiles, eq(profiles.email, users.email))
    .where(
      and(
        eq(schoolMemberships.schoolId, schoolId),
        eq(schoolMemberships.isActive, true),
      ),
    );

  return rows;
}

async function getParentRecipients(
  schoolId: string,
  studentIds: string[],
) {
  if (studentIds.length === 0) {
    return [];
  }

  const rows = await db
    .select({
      authUserId: profiles.authUserId,
      email: profiles.email,
    })
    .from(studentGuardians)
    .innerJoin(
      guardians,
      eq(guardians.id, studentGuardians.guardianId),
    )
    .innerJoin(
      profiles,
      eq(profiles.email, guardians.email),
    )
    .where(
      and(
        eq(guardians.schoolId, schoolId),
        inArray(studentGuardians.studentId, studentIds),
      ),
    );

  return rows;
}

async function getClassStudentIds(
  schoolId: string,
  classId: string,
) {
  const rows = await db
    .select({
      id: students.id,
    })
    .from(students)
    .innerJoin(
      studentUserAccounts,
      eq(studentUserAccounts.studentId, students.id),
    )
    .innerJoin(
      profiles,
      eq(profiles.email, studentUserAccounts.email),
    )
    .where(eq(students.schoolId, schoolId));

  /*
   * Student placement/enrollment relationships vary by the
   * current academic-year implementation. The announcement
   * target itself is validated in actions.ts. This resolver
   * deliberately avoids assuming a placement table here.
   */

  return rows
    .map((row) => row.id)
    .filter(Boolean);
}

export async function resolveAnnouncementRecipients({
  schoolId,
  audience,
  targetId,
}: {
  schoolId: string;
  audience: Audience;
  targetId: string | null;
}) {
  switch (audience) {
    case "school":
    case "students":
      return uniqueRecipients(
        await getAllStudentRecipients(schoolId),
      );

    case "staff":
      return uniqueRecipients(
        await getStaffRecipients(schoolId),
      );

    case "individual": {
      if (!targetId) return [];

      return uniqueRecipients(
        await getStudentRecipients(schoolId, [targetId]),
      );
    }

    case "parents": {
      if (!targetId) return [];

      /*
       * For a parent-targeted announcement, targetId is a
       * guardian ID according to the announcement CRUD layer.
       */
      const rows = await db
        .select({
          authUserId: profiles.authUserId,
          email: profiles.email,
        })
        .from(guardians)
        .innerJoin(
          profiles,
          eq(profiles.email, guardians.email),
        )
        .where(
          and(
            eq(guardians.id, targetId),
            eq(guardians.schoolId, schoolId),
          ),
        );

      return uniqueRecipients(rows);
    }

    case "class":
    case "stream":
      /*
       * These require the authoritative student-placement model
       * to determine current membership. The notification layer
       * should not guess using the legacy enrollment relationship.
       *
       * Return an empty recipient set until the placement query
       * is wired to the exact schema used by this project.
       */
      return [];

    default:
      return [];
  }
}

export async function createAnnouncementNotifications({
  schoolId,
  announcementId,
  title,
  body,
  audience,
  targetId,
}: {
  schoolId: string;
  announcementId: string;
  title: string;
  body: string;
  audience: Audience;
  targetId: string | null;
}) {
  const recipients = await resolveAnnouncementRecipients({
    schoolId,
    audience,
    targetId,
  });

  if (recipients.length === 0) {
    return 0;
  }

  await db.insert(notifications).values(
    recipients.map((recipient) => ({
      schoolId,
      recipientAuthUserId: recipient.authUserId,
      title,
      body,
      type: "announcement",
    })),
  );

  return recipients.length;
}