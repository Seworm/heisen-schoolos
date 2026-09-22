"use server";

import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { schoolMemberships, staff, users } from "@/db/schema";
import { requireCurrentSchool } from "@/lib/current-school";
import { requireRole } from "@/lib/authorization";

export async function archiveStaff(formData: FormData) {
  const school = await requireCurrentSchool();
  await requireRole(["school_owner", "school_admin", "principal", "headteacher"], school.id);
  const staffId = String(formData.get("staffId") ?? "");
  const [member] = await db.update(staff).set({ status: "inactive", updatedAt: new Date() }).where(and(eq(staff.id, staffId), eq(staff.schoolId, school.id))).returning({ email: staff.email });
  if (!member) throw new Error("Staff record not found.");
  if (member.email) {
    const [matchingUser] = await db.select({ id: users.id }).from(users).where(eq(users.email, member.email.toLowerCase())).limit(1);
    if (matchingUser) await db.update(schoolMemberships).set({ isActive: false, updatedAt: new Date() }).where(and(eq(schoolMemberships.userId, matchingUser.id), eq(schoolMemberships.schoolId, school.id)));
  }
}
