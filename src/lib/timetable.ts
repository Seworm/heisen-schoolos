import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { timetableEntries } from "@/db/schema";

export type TimetableSlot = {
  id: string;
  dayOfWeek: number;
  sortOrder: number;
};

export type TimetableAssignment = {
  id: string;
  streamId: string;
  subjectId: string;
  staffId: string;
};

export type TimetableOccupiedSlot = {
  streamId: string;
  staffId: string;
  classroomId: string | null;
  periodId: string;
};

export type TimetablePlanEntry = {
  assignmentId: string;
  streamId: string;
  subjectId: string;
  staffId: string;
  periodId: string;
  classroomId: string | null;
  lessonNumber: number;
};

export type TimetableUnscheduled = {
  assignmentId: string;
  lessonNumber: number;
  reason: "teacher_busy" | "class_busy" | "no_period" | "no_classroom";
};

export type TimetablePlan = {
  entries: TimetablePlanEntry[];
  unscheduled: TimetableUnscheduled[];
};

/**
 * Builds a conflict-free weekly timetable in memory.
 *
 * Assignments with fewer available slots are scheduled first. This
 * prevents flexible assignments from consuming the only viable slots
 * for teachers or classes.
 */
export function buildTimetablePlan(input: {
  assignments: TimetableAssignment[];
  periods: TimetableSlot[];
  classrooms?: Array<{ id: string }>;
  occupied: TimetableOccupiedSlot[];
  lessonsPerAssignment: number;
  existingLessonCounts?: Record<string, number>;
}): TimetablePlan {
  const lessonsPerAssignment = Math.max(
    1,
    Math.min(5, Math.floor(input.lessonsPerAssignment)),
  );
  const periods = [...input.periods].sort(
    (a, b) => a.dayOfWeek - b.dayOfWeek || a.sortOrder - b.sortOrder,
  );
  const classroomIds = input.classrooms?.map((classroom) => classroom.id) ?? [];
  const occupiedPeriods = new Set(
    input.occupied.map((entry) => `${entry.periodId}:${entry.streamId}`),
  );
  const occupiedTeachers = new Set(
    input.occupied.map((entry) => `${entry.periodId}:${entry.staffId}`),
  );
  const occupiedRooms = new Set(
    input.occupied
      .filter((entry) => entry.classroomId)
      .map((entry) => `${entry.periodId}:${entry.classroomId}`),
  );
  const scheduledByAssignment = new Map<string, number>();
  const entries: TimetablePlanEntry[] = [];
  const unscheduled: TimetableUnscheduled[] = [];

  const assignmentAvailability = (assignment: TimetableAssignment) =>
    periods.filter(
      (period) =>
        !occupiedPeriods.has(`${period.id}:${assignment.streamId}`) &&
        !occupiedTeachers.has(`${period.id}:${assignment.staffId}`),
    ).length;

  const assignments = [...input.assignments].sort(
    (a, b) => assignmentAvailability(a) - assignmentAvailability(b),
  );

  for (const assignment of assignments) {
    const assignmentKey = `${assignment.streamId}:${assignment.subjectId}:${assignment.staffId}`;
    const alreadyScheduled =
      input.existingLessonCounts?.[assignmentKey] ??
      scheduledByAssignment.get(assignment.id) ??
      0;

    for (let lessonNumber = alreadyScheduled + 1; lessonNumber <= lessonsPerAssignment; lessonNumber += 1) {
      const candidatePeriods = periods
        .filter(
          (period) =>
            !occupiedPeriods.has(`${period.id}:${assignment.streamId}`) &&
            !occupiedTeachers.has(`${period.id}:${assignment.staffId}`),
        )
        .sort((a, b) => {
          const aLoad = entries.filter(
            (entry) => entry.staffId === assignment.staffId && entry.periodId === a.id,
          ).length;
          const bLoad = entries.filter(
            (entry) => entry.staffId === assignment.staffId && entry.periodId === b.id,
          ).length;
          return aLoad - bLoad || a.dayOfWeek - b.dayOfWeek || a.sortOrder - b.sortOrder;
        });

      const period = candidatePeriods[0];
      if (!period) {
        const teacherHasSpace = periods.some(
          (candidate) => !occupiedTeachers.has(`${candidate.id}:${assignment.staffId}`),
        );
        const classHasSpace = periods.some(
          (candidate) => !occupiedPeriods.has(`${candidate.id}:${assignment.streamId}`),
        );
        unscheduled.push({
          assignmentId: assignment.id,
          lessonNumber,
          reason: teacherHasSpace && !classHasSpace ? "class_busy" : "teacher_busy",
        });
        continue;
      }

      const classroomId =
        classroomIds.find(
          (id) => !occupiedRooms.has(`${period.id}:${id}`),
        ) ?? (classroomIds.length === 0 ? null : undefined);

      if (classroomId === undefined) {
        unscheduled.push({
          assignmentId: assignment.id,
          lessonNumber,
          reason: "no_classroom",
        });
        continue;
      }

      const entry = {
        assignmentId: assignment.id,
        streamId: assignment.streamId,
        subjectId: assignment.subjectId,
        staffId: assignment.staffId,
        periodId: period.id,
        classroomId,
        lessonNumber,
      };
      entries.push(entry);
      occupiedPeriods.add(`${period.id}:${assignment.streamId}`);
      occupiedTeachers.add(`${period.id}:${assignment.staffId}`);
      if (classroomId) occupiedRooms.add(`${period.id}:${classroomId}`);
      scheduledByAssignment.set(
        assignment.id,
        (scheduledByAssignment.get(assignment.id) ?? 0) + 1,
      );
    }
  }

  return { entries, unscheduled };
}

export async function assertTimetableSlotAvailable(input: {
  schoolId: string;
  streamId: string;
  staffId: string;
  classroomId?: string | null;
  periodId: string;
  excludeEntryId?: string;
}) {
  const conflicts = await db
    .select({
      id: timetableEntries.id,
      streamId: timetableEntries.streamId,
      staffId: timetableEntries.staffId,
      classroomId: timetableEntries.classroomId,
    })
    .from(timetableEntries)
    .where(
      and(
        eq(timetableEntries.schoolId, input.schoolId),
        eq(timetableEntries.periodId, input.periodId),
      ),
    );
  const active = conflicts.filter((row) => row.id !== input.excludeEntryId);
  if (active.some((row) => row.streamId === input.streamId)) {
    throw new Error("This class already has a lesson in the selected period.");
  }
  if (active.some((row) => row.staffId === input.staffId)) {
    throw new Error("This teacher is already booked in the selected period.");
  }
  if (input.classroomId && active.some((row) => row.classroomId === input.classroomId)) {
    throw new Error("This classroom is already booked in the selected period.");
  }
}
