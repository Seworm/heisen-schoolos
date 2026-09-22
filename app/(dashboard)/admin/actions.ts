"use server";

import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { schoolMemberships, schools, staffInvitations, users } from "@/db/schema";
import { getNeonAuth } from "@/lib/auth/server";
import { requireRole } from "@/lib/authorization";
import { z } from "zod";
import { sendInvitationEmail } from "@/lib/email";

const staffUserSchema = z.object({
  email: z.string().email(),
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(100),
  role: z.enum(["school_owner","school_admin","principal","headteacher","teacher","accountant","bursar","secretary","librarian","nurse","staff"]),
  schoolId: z.string().uuid().optional(),
});

export async function createStaffInvitation(input: unknown) {
  const actor = await requireRole([
    "platform_admin", "school_owner", "school_admin", "principal",
    "headteacher", "super_admin",
  ]);
  const data = staffUserSchema.parse(input);
  const targetSchoolId = actor.role === "super_admin" || actor.role === "platform_admin" ? data.schoolId : actor.schoolId;
  if (!targetSchoolId) throw new Error("Select a school for this invitation.");
  const token = `${crypto.randomUUID()}${crypto.randomUUID()}`;
  const tokenHash = Buffer.from(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token))).toString("hex");
  const email = data.email.toLowerCase();
  await db.update(staffInvitations)
    .set({ acceptedAt: new Date() })
    .where(and(
      eq(staffInvitations.email, email),
      eq(staffInvitations.schoolId, targetSchoolId),
    ));
  await db.insert(staffInvitations).values({
    schoolId: targetSchoolId, email, firstName: data.firstName, lastName: data.lastName,
    role: data.role, tokenHash, expiresAt: new Date(Date.now() + 604800000), createdBy: actor.authUserId ?? actor.id,
  });
  const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? ""}/auth/accept-invitation?token=${token}`;
  const [school] = await db.select({ name: schools.name }).from(schools).where(eq(schools.id, targetSchoolId)).limit(1);
  const delivery = await sendInvitationEmail({
    to: email,
    name: `${data.firstName} ${data.lastName}`,
    inviteUrl,
    schoolName: school?.name ?? "your school",
  });
  return { success: true, inviteUrl, emailSent: delivery.sent };
}

export async function acceptStaffInvitation(input: { token: string }) {
  const email = (await getNeonAuth().getSession()).data?.user?.email?.trim().toLowerCase();
  if (!email) throw new Error("Sign in or create your account before accepting the invitation.");
  const tokenHash = Buffer.from(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input.token))).toString("hex");
  const [invitation] = await db.select().from(staffInvitations).where(and(eq(staffInvitations.tokenHash, tokenHash), eq(staffInvitations.email, email))).limit(1);
  if (!invitation || invitation.acceptedAt || invitation.expiresAt < new Date()) throw new Error("This invitation is invalid, expired, or already used.");
  const [user] = await db.insert(users).values({ email, passwordHash: "NEON_AUTH_MANAGED", firstName: invitation.firstName, lastName: invitation.lastName }).onConflictDoNothing({ target: users.email }).returning();
  const [localUser] = user ? [user] : await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (!localUser) throw new Error("Unable to create the application profile.");
  await db.insert(schoolMemberships).values({ userId: localUser.id, schoolId: invitation.schoolId, role: invitation.role, isActive: true }).onConflictDoNothing();
  await db.update(staffInvitations).set({ acceptedAt: new Date() }).where(eq(staffInvitations.id, invitation.id));
  return { success: true };
}
