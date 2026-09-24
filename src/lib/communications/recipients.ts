import { and, eq, inArray } from "drizzle-orm";

import { db } from "@/db";
import {
  guardians,
  classLevels,
  notifications,
  profiles,
  schoolMemberships,
  streams,
  studentEnrollments,
  studentGuardians,
  studentPlacements,
  studentUserAccounts,
  students,
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

async function getPlacedStudentIds(
  schoolId: string,
  audience: "class" | "stream",
  targetId: string,
) {
  const rows = await db
    .select({ studentId: studentEnrollments.studentId })
    .from(studentEnrollments)
    .innerJoin(
      students,
      eq(students.id, studentEnrollments.studentId),
    )
    .innerJoin(
      studentPlacements,
      eq(studentPlacements.studentEnrollmentId, studentEnrollments.id),
    )
    .innerJoin(
      streams,
      eq(streams.id, studentPlacements.streamId),
    )
    .innerJoin(
      classLevels,
      eq(classLevels.id, streams.classLevelId),
    )
    .where(
      and(
        eq(students.schoolId, schoolId),
        eq(studentEnrollments.status, "active"),
        eq(studentPlacements.status, "active"),
        audience === "class"
          ? eq(classLevels.id, targetId)
          : eq(streams.id, targetId),
      ),
    );

  return [...new Set(rows.map((row) => row.studentId))];
}

async function getGuardianRecipientsForStudents(
  schoolId: string,
  studentIds: string[],
) {
  if (studentIds.length === 0) {
    return [];
  }

  return db
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
    case "stream": {
      if (!targetId) return [];

      const studentIds = await getPlacedStudentIds(
        schoolId,
        audience,
        targetId,
      );
      const [studentRecipients, guardianRecipients] = await Promise.all([
        getStudentRecipients(schoolId, studentIds),
        getGuardianRecipientsForStudents(schoolId, studentIds),
      ]);

      return uniqueRecipients([
        ...studentRecipients,
        ...guardianRecipients,
      ]);
    }

    default:
      return [];
  }
}

export async function createAnnouncementNotifications({
  schoolId,
  title,
  body,
  audience,
  targetId,
}: {
  schoolId: string;
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