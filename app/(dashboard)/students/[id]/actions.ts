"use server";

import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { students } from "@/db/schema";
import { requireCurrentSchool, } from "@/lib/current-school";
import { requireRole } from "@/lib/authorization";
import { revalidatePath } from "next/cache";
import { writeAuditLog } from "@/lib/audit";

export async function archiveStudent(formData: FormData) {
  const school = await requireCurrentSchool();
  await requireRole(["school_owner", "school_admin", "principal", "headteacher"], school.id);
  const studentId = String(formData.get("studentId") ?? "");
  const [student] = await db.update(students).set({ status: "archived", updatedAt: new Date() }).where(and(eq(students.id, studentId), eq(students.schoolId, school.id))).returning({ id: students.id });
  if (!student) throw new Error("Student record not found.");
}

export async function deleteStudent(formData: FormData) {
  const school = await requireCurrentSchool();
  const actor = await requireRole(["school_owner", "school_admin", "principal"], school.id);
  const studentId = String(formData.get("studentId") ?? "");

  try {
    const [deleted] = await db
      .delete(students)
      .where(and(eq(students.id, studentId), eq(students.schoolId, school.id)))
      .returning({ id: students.id });
    if (!deleted) throw new Error("Student record not found.");
    await writeAuditLog({
      schoolId: school.id,
      actorAuthUserId: actor.authUserId ?? actor.id,
      action: "student_deleted",
      entity: "student",
      entityId: studentId,
    });
    revalidatePath("/students");
  } catch (error) {
    if (error instanceof Error && error.message === "Student record not found.") throw error;
    throw new Error("This student has linked academic or financial records and cannot be permanently deleted. Archive the record instead.");
  }
}
