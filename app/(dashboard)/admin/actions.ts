"use server";

import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { schoolMemberships, schools, users } from "@/db/schema";
import { getNeonAuth } from "@/lib/auth/server";
import { requireRole } from "@/lib/authorization";
import { writeAuditLog } from "@/lib/audit";
import { z } from "zod";

const staffUserSchema = z.object({
  email: z.string().email(),
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(100),
  role: z.enum(["school_owner","school_admin","principal","headteacher","teacher","accountant","bursar","secretary","librarian","nurse","staff"]),
  schoolId: z.string().uuid().optional(),
});

export async function createStaffAccess(input: unknown) {
  const actor = await requireRole([
    "platform_admin",
    "school_owner",
    "school_admin",
    "principal",
    "headteacher",
    "super_admin",
  ]);
  const data = staffUserSchema.parse(input);
  const isPlatformAdmin =
    actor.role === "super_admin" || actor.role === "platform_admin";
  const targetSchoolId = isPlatformAdmin
    ? data.schoolId
    : actor.schoolId;

  if (!targetSchoolId) {
    throw new Error("Select a school for this staff account.");
  }

  const [school] = await db
    .select({ id: schools.id })
    .from(schools)
    .where(
      and(
        eq(schools.id, targetSchoolId),
        eq(schools.status, "active"),
      ),
    )
    .limit(1);

  if (!school) {
    throw new Error("The selected school is not available.");
  }

  const email = data.email.toLowerCase();
  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (existing) throw new Error("A local application user already exists for this email.");

  const neon = getNeonAuth();
  const temporaryPassword = `${crypto.randomUUID()}A9!`;
  const result = await neon.admin.createUser({ email, password: temporaryPassword, name: `${data.firstName} ${data.lastName}`, role: "user" });
  if (result.error) {
    console.error("Neon Auth createUser failed:", result.error);
    throw new Error(
      result.error.message || "Unable to create the authentication account.",
    );
  }
  const authUserId = result.data?.user?.id;
  if (!authUserId) throw new Error("Authentication provider did not return a user id.");
  const [user] = await db.insert(users).values({ email, passwordHash: "NEON_AUTH_MANAGED", firstName: data.firstName, lastName: data.lastName }).returning();
  await db.insert(schoolMemberships).values({ userId: user.id, schoolId: school.id, role: data.role, isActive: true });
  await writeAuditLog({ schoolId: school.id, actorAuthUserId: actor.authUserId ?? actor.id, action: "staff_user_created", entity: "user", entityId: user.id, metadata: { email, role: data.role, neonAuthUserId: authUserId } });
  return { success: true, email, temporaryPassword };
}
