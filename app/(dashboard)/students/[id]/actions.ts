"use server";

import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { students } from "@/db/schema";
import { requireCurrentSchool, } from "@/lib/current-school";
import { requireRole } from "@/lib/authorization";

export async function archiveStudent(formData: FormData) {
  const school = await requireCurrentSchool();
  await requireRole(["school_owner", "school_admin", "principal", "headteacher"], school.id);
  const studentId = String(formData.get("studentId") ?? "");
  const [student] = await db.update(students).set({ status: "archived", updatedAt: new Date() }).where(and(eq(students.id, studentId), eq(students.schoolId, school.id))).returning({ id: students.id });
  if (!student) throw new Error("Student record not found.");
}
