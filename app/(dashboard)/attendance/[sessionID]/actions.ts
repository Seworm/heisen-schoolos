"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { db } from "@/db";
import { attendanceSessions } from "@/db/schema";
import { requirePermission } from "@/lib/authorization";
import { requireCurrentSchool } from "@/lib/current-school";

export async function cancelAttendanceSession(sessionId: string) {
  const school = await requireCurrentSchool();
  await requirePermission("attendance.manage", school.id);

  const result = await db
    .update(attendanceSessions)
    .set({
      status: "cancelled",
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(attendanceSessions.id, sessionId),
        eq(attendanceSessions.schoolId, school.id),
      ),
    )
    .returning({ id: attendanceSessions.id });

  if (result.length === 0) {
    throw new Error("Attendance session not found.");
  }

  revalidatePath(`/attendance/${sessionId}`);
  revalidatePath("/attendance");

  redirect(`/attendance/${sessionId}`);
}

export async function reopenAttendanceSession(sessionId: string) {
  const school = await requireCurrentSchool();
  await requirePermission("attendance.manage", school.id);

  const result = await db
    .update(attendanceSessions)
    .set({
      status: "open",
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(attendanceSessions.id, sessionId),
        eq(attendanceSessions.schoolId, school.id),
      ),
    )
    .returning({ id: attendanceSessions.id });

  if (result.length === 0) {
    throw new Error("Attendance session not found.");
  }

  revalidatePath(`/attendance/${sessionId}`);
  revalidatePath("/attendance");

  redirect(`/attendance/${sessionId}`);
}