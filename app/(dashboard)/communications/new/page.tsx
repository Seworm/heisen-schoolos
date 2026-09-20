import { asc, eq } from "drizzle-orm";

import { db } from "@/db";
import {
  classLevels,
  guardians,
  streams,
  students,
} from "@/db/schema";
import { getApplicationSession } from "@/lib/auth/compat";
import AnnouncementForm from "../AnnouncementForm";

export default async function NewAnnouncementPage() {
  const session = await getApplicationSession();

  if (!session?.user || session.user.accountType !== "staff") {
    throw new Error("You must be signed in as a staff member.");
  }

  const schoolId = session.user.schoolId;

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
          New announcement
        </h1>

        <p className="mt-2 text-sm text-muted-foreground">
          Create an announcement for students, parents, staff or the whole
          school.
        </p>
      </div>

      <AnnouncementForm
        mode="create"
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
