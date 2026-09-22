"use server";

import { and, asc, eq, sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import {
  academicYears,
  classLevels,
  classrooms,
  staff,
  streams,
  subjects,
  teacherAssignments,
  terms,
  timetableEntries,
  timetablePeriods,
} from "@/db/schema";
import { requireRole } from "@/lib/authorization";
import { getCurrentSchool } from "@/lib/current-school";
import { buildTimetablePlan } from "@/lib/timetable";

export async function generateIntelligentTimetable(formData: FormData) {
  const school = await getCurrentSchool();
  await requireRole([
    "super_admin",
    "platform_admin",
    "school_owner",
    "school_admin",
    "principal",
    "headteacher",
  ]);
  const academicYearId = String(formData.get("academicYearId") ?? "");
  const termId = String(formData.get("termId") ?? "");
  const lessonsPerAssignment = Number(formData.get("lessonsPerAssignment") ?? 1);

  if (!academicYearId || !termId) {
    throw new Error("Select an academic year and term before generating.");
  }
  if (!Number.isInteger(lessonsPerAssignment) || lessonsPerAssignment < 1 || lessonsPerAssignment > 5) {
    throw new Error("Lessons per subject must be between 1 and 5.");
  }

  const result = await db.transaction(async (tx) => {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${`timetable:${school.id}:${academicYearId}:${termId}`}))`);

    const [year] = await tx
      .select({ id: academicYears.id })
      .from(academicYears)
      .where(and(eq(academicYears.id, academicYearId), eq(academicYears.schoolId, school.id)))
      .limit(1);
    const [term] = await tx
      .select({ id: terms.id })
      .from(terms)
      .where(and(eq(terms.id, termId), eq(terms.academicYearId, academicYearId)))
      .limit(1);
    if (!year || !term) throw new Error("The selected academic period is not valid for this school.");

    const periods = await tx
      .select({ id: timetablePeriods.id, dayOfWeek: timetablePeriods.dayOfWeek, sortOrder: timetablePeriods.sortOrder })
      .from(timetablePeriods)
      .where(eq(timetablePeriods.schoolId, school.id))
      .orderBy(asc(timetablePeriods.dayOfWeek), asc(timetablePeriods.sortOrder));
    if (periods.length === 0) throw new Error("Configure timetable periods before generating a schedule.");

    const assignments = await tx
      .select({
        id: teacherAssignments.id,
        streamId: teacherAssignments.streamId,
        subjectId: teacherAssignments.subjectId,
        staffId: teacherAssignments.staffId,
      })
      .from(teacherAssignments)
      .innerJoin(staff, eq(staff.id, teacherAssignments.staffId))
      .innerJoin(streams, eq(streams.id, teacherAssignments.streamId))
      .innerJoin(classLevels, eq(classLevels.id, streams.classLevelId))
      .innerJoin(subjects, eq(subjects.id, teacherAssignments.subjectId))
      .where(
        and(
          eq(staff.schoolId, school.id),
          eq(classLevels.schoolId, school.id),
          eq(subjects.schoolId, school.id),
          eq(teacherAssignments.academicYearId, academicYearId),
          sql`${teacherAssignments.subjectId} IS NOT NULL`,
        ),
      );
    if (assignments.length === 0) throw new Error("Assign teachers to subjects before generating a timetable.");

    const occupied = await tx
      .select({
        periodId: timetableEntries.periodId,
        streamId: timetableEntries.streamId,
        subjectId: timetableEntries.subjectId,
        staffId: timetableEntries.staffId,
        classroomId: timetableEntries.classroomId,
      })
      .from(timetableEntries)
      .where(
        and(
          eq(timetableEntries.schoolId, school.id),
          eq(timetableEntries.academicYearId, academicYearId),
          eq(timetableEntries.termId, termId),
        ),
      );
    const availableClassrooms = await tx
      .select({ id: classrooms.id })
      .from(classrooms)
      .where(and(eq(classrooms.schoolId, school.id), eq(classrooms.active, true)));

    const plan = buildTimetablePlan({
      assignments: assignments.map((assignment) => ({
        ...assignment,
        subjectId: assignment.subjectId as string,
      })),
      periods,
      classrooms: availableClassrooms,
      occupied,
      lessonsPerAssignment,
      existingLessonCounts: occupied.reduce<Record<string, number>>(
        (counts, entry) => {
          const key = `${entry.streamId}:${entry.subjectId}:${entry.staffId}`;
          counts[key] = (counts[key] ?? 0) + 1;
          return counts;
        },
        {},
      ),
    });

    for (const entry of plan.entries) {
      await tx.insert(timetableEntries).values({
        schoolId: school.id,
        academicYearId,
        termId,
        streamId: entry.streamId,
        subjectId: entry.subjectId,
        staffId: entry.staffId,
        periodId: entry.periodId,
        classroomId: entry.classroomId,
      });
    }

    return {
      scheduled: plan.entries.length,
      unscheduled: plan.unscheduled.length,
    };
  });

  redirect(`/timetable?year=${encodeURIComponent(academicYearId)}&term=${encodeURIComponent(termId)}&scheduled=${result.scheduled}&unscheduled=${result.unscheduled}`);
}

export async function createTimetablePeriod(formData: FormData) {
  const school = await getCurrentSchool();
  await requireRole(["super_admin", "platform_admin", "school_owner", "school_admin", "principal", "headteacher"]);
  const name = String(formData.get("name") ?? "").trim();
  const dayOfWeek = Number(formData.get("dayOfWeek"));
  const startsAt = String(formData.get("startsAt") ?? "");
  const endsAt = String(formData.get("endsAt") ?? "");
  const sortOrder = Number(formData.get("sortOrder"));
  if (!name || !/^\d{2}:\d{2}$/.test(startsAt) || !/^\d{2}:\d{2}$/.test(endsAt) || !Number.isInteger(dayOfWeek) || dayOfWeek < 1 || dayOfWeek > 7 || !Number.isInteger(sortOrder) || sortOrder < 1) {
    throw new Error("Enter a valid period name, day, time range and order.");
  }
  if (startsAt >= endsAt) throw new Error("Period end time must be after its start time.");
  await db.insert(timetablePeriods).values({ schoolId: school.id, name, dayOfWeek, startsAt, endsAt, sortOrder });
  redirect("/timetable");
}

export async function deleteTimetablePeriod(formData: FormData) {
  const school = await getCurrentSchool();
  await requireRole(["super_admin", "platform_admin", "school_owner", "school_admin", "principal", "headteacher"]);
  const periodId = String(formData.get("periodId") ?? "");
  const [period] = await db.select({ id: timetablePeriods.id }).from(timetablePeriods).where(and(eq(timetablePeriods.id, periodId), eq(timetablePeriods.schoolId, school.id))).limit(1);
  if (!period) throw new Error("Timetable period not found.");
  await db.delete(timetablePeriods).where(eq(timetablePeriods.id, period.id));
  redirect("/timetable");
}
