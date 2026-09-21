"use server";

import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { schoolMemberships, schools, users } from "@/db/schema";
import { requireSuperAdmin } from "@/lib/authorization";
import { writeAuditLog } from "@/lib/audit";

const membershipRole = z.enum([
  "school_owner", "school_admin", "principal", "headteacher", "teacher",
  "accountant", "bursar", "secretary", "librarian", "nurse", "parent",
  "student", "staff",
]);
const userStatus = z.enum(["active", "inactive", "suspended"]);
const id = z.string().uuid();

async function activeSchool(schoolId: string) {
  const [school] = await db.select({ id: schools.id }).from(schools)
    .where(and(eq(schools.id, schoolId), eq(schools.status, "active"))).limit(1);
  if (!school) throw new Error("The selected school is not available.");
  return school;
}

export async function grantSchoolMembership(input: unknown) {
  const actor = await requireSuperAdmin();
  const data = z.object({ email: z.string().email(), schoolId: id, role: membershipRole }).parse(input);
  await activeSchool(data.schoolId);
  const email = data.email.trim().toLowerCase();
  const [user] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (!user) throw new Error("No local account exists for this email. Create the user account first.");

  const [existing] = await db.select({ id: schoolMemberships.id, isActive: schoolMemberships.isActive })
    .from(schoolMemberships).where(and(eq(schoolMemberships.userId, user.id), eq(schoolMemberships.schoolId, data.schoolId))).limit(1);
  if (existing?.isActive) throw new Error("This user is already an active member of the selected school.");
  const membership = existing
    ? (await db.update(schoolMemberships).set({ role: data.role, isActive: true, updatedAt: new Date() })
      .where(eq(schoolMemberships.id, existing.id)).returning({ id: schoolMemberships.id }))[0]
    : (await db.insert(schoolMemberships).values({ userId: user.id, schoolId: data.schoolId, role: data.role, isActive: true }).returning({ id: schoolMemberships.id }))[0];
  if (!membership) throw new Error("Unable to grant school membership.");
  await writeAuditLog({ schoolId: data.schoolId, actorAuthUserId: actor.authUserId ?? actor.id, action: "school_membership_granted", entity: "school_membership", entityId: membership.id, metadata: { userId: user.id, email, role: data.role } });
  return { success: true };
}

export async function updateSchoolMembership(input: unknown) {
  const actor = await requireSuperAdmin();
  const data = z.object({ membershipId: id, role: membershipRole }).parse(input);
  const [membership] = await db.update(schoolMemberships).set({ role: data.role, updatedAt: new Date() })
    .where(eq(schoolMemberships.id, data.membershipId)).returning({ id: schoolMemberships.id, schoolId: schoolMemberships.schoolId, userId: schoolMemberships.userId });
  if (!membership) throw new Error("Membership not found.");
  await writeAuditLog({ schoolId: membership.schoolId, actorAuthUserId: actor.authUserId ?? actor.id, action: "school_membership_role_updated", entity: "school_membership", entityId: membership.id, metadata: { userId: membership.userId, role: data.role } });
  return { success: true };
}

export async function revokeSchoolMembership(membershipId: string) {
  const actor = await requireSuperAdmin();
  const parsed = id.parse(membershipId);
  const [membership] = await db.update(schoolMemberships).set({ isActive: false, updatedAt: new Date() })
    .where(eq(schoolMemberships.id, parsed)).returning({ id: schoolMemberships.id, schoolId: schoolMemberships.schoolId, userId: schoolMemberships.userId });
  if (!membership) throw new Error("Membership not found.");
  await writeAuditLog({ schoolId: membership.schoolId, actorAuthUserId: actor.authUserId ?? actor.id, action: "school_membership_revoked", entity: "school_membership", entityId: membership.id, metadata: { userId: membership.userId } });
  return { success: true };
}

export async function reactivateSchoolMembership(membershipId: string) {
  const actor = await requireSuperAdmin();
  const parsed = id.parse(membershipId);
  const [membership] = await db.update(schoolMemberships).set({ isActive: true, updatedAt: new Date() })
    .where(eq(schoolMemberships.id, parsed)).returning({ id: schoolMemberships.id, schoolId: schoolMemberships.schoolId, userId: schoolMemberships.userId });
  if (!membership) throw new Error("Membership not found.");
  await writeAuditLog({ schoolId: membership.schoolId, actorAuthUserId: actor.authUserId ?? actor.id, action: "school_membership_reactivated", entity: "school_membership", entityId: membership.id, metadata: { userId: membership.userId } });
  return { success: true };
}

export async function updatePlatformUserStatus(input: unknown) {
  const actor = await requireSuperAdmin();
  const data = z.object({ userId: id, status: userStatus }).parse(input);
  if (data.userId === actor.id && data.status !== "active") throw new Error("You cannot deactivate your own account.");
  const [user] = await db.update(users).set({ status: data.status, updatedAt: new Date() })
    .where(eq(users.id, data.userId)).returning({ id: users.id, email: users.email });
  if (!user) throw new Error("User not found.");
  await writeAuditLog({ actorAuthUserId: actor.authUserId ?? actor.id, action: "platform_user_status_updated", entity: "user", entityId: user.id, metadata: { email: user.email, status: data.status } });
  return { success: true };
}
