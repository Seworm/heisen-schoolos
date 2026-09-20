import { and, asc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";

import { db } from "@/db";
import {
  announcements,
  classLevels,
  guardians,
  streams,
  students,
} from "@/db/schema";
import { getApplicationSession } from "@/lib/auth/compat";
import AnnouncementForm from "../../AnnouncementForm";

type EditAnnouncementPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditAnnouncementPage({
  params,
}: EditAnnouncementPageProps) {
  const session = await getApplicationSession();

  if (!session?.user || session.user.accountType !== "staff") {
    throw new Error("You must be signed in as a staff member.");
  }

  const schoolId = session.user.schoolId;
  const { id } = await params;

  const [announcement] = await db
    .select()
    .from(announcements)
    .where(
      and(
        eq(announcements.id, id),
        eq(announcements.schoolId, schoolId),
      ),
    )
    .limit(1);

  if (!announcement) {
    notFound();
  }

  const [classes, streamRows, studentRows, guardianRows] = await Promise.all([
    db
      .select({
        id: classLevels.id,
        label: classLevels.name,
      })
      .from(classLevels)
      .where(eq(classLevels.schoolId, schoolId))
      .orderBy(asc(classLevels.sortOrder), asc(classLevels.name)),

    db
      .select({
        id: streams.id,
        label: streams.name,
      })
      .from(streams)
      .innerJoin(
        classLevels,
        eq(classLevels.id, streams.classLevelId),
      )
      .where(eq(classLevels.schoolId, schoolId))
      .orderBy(asc(classLevels.sortOrder), asc(streams.name)),

    db
      .select({
        id: students.id,
        label: students.studentNumber,
        firstName: students.firstName,
        lastName: students.lastName,
      })
      .from(students)
      .where(eq(students.schoolId, schoolId))
      .orderBy(asc(students.lastName), asc(students.firstName)),

    db
      .select({
        id: guardians.id,
        label: guardians.email,
        firstName: guardians.firstName,
        lastName: guardians.lastName,
      })
      .from(guardians)
      .where(eq(guardians.schoolId, schoolId))
      .orderBy(asc(guardians.lastName), asc(guardians.firstName)),
  ]);

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <p className="text-sm font-medium text-muted-foreground">
          Communications
        </p>

        <h1 className="mt-1 text-3xl font-semibold tracking-tight">
          Edit announcement
        </h1>

        <p className="mt-2 text-sm text-muted-foreground">
          Update the announcement details and publication settings.
        </p>
      </div>

      <AnnouncementForm
        mode="edit"
        announcementId={announcement.id}
        initialTitle={announcement.title}
        initialBody={announcement.body}
        initialAudience={announcement.audience}
        initialTargetId={announcement.targetId}
        initialExpiresAt={announcement.expiresAt?.toISOString() ?? null}
        classes={classes}
        streams={streamRows}
        students={studentRows.map((student) => ({
          id: student.id,
          label: `${student.label} · ${student.firstName} ${student.lastName}`,
        }))}
        guardians={guardianRows.map((guardian) => ({
          id: guardian.id,
          label:
            guardian.label ??
            `${guardian.firstName} ${guardian.lastName}`,
        }))}
      />
    </div>
  );
}
