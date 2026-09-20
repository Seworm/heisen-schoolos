import { eq } from "drizzle-orm";
import { db } from "@/db";
import { timetableEntries } from "@/db/schema";

export async function assertTimetableSlotAvailable(input: { streamId: string; staffId: string; classroomId?: string | null; periodId: string; excludeEntryId?: string }) {
  const conflicts = await db.select({ id: timetableEntries.id, streamId: timetableEntries.streamId, staffId: timetableEntries.staffId, classroomId: timetableEntries.classroomId })
    .from(timetableEntries)
    .where(eq(timetableEntries.periodId, input.periodId));
  const active = conflicts.filter((row) => row.id !== input.excludeEntryId);
  if (active.some((row) => row.streamId === input.streamId)) throw new Error("This class already has a lesson in the selected period.");
  if (active.some((row) => row.staffId === input.staffId)) throw new Error("This teacher is already booked in the selected period.");
  if (input.classroomId && active.some((row) => row.classroomId === input.classroomId)) throw new Error("This classroom is already booked in the selected period.");
}
