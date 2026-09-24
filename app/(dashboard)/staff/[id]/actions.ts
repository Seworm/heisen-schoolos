"use server";

import { and, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { schoolMemberships, staff, staffInvitations, users } from "@/db/schema";
import { requireCurrentSchool } from "@/lib/current-school";
import { requireRole } from "@/lib/authorization";
import { writeAuditLog } from "@/lib/audit";
import { createStaffInvitation } from "@/../app/(dashboard)/admin/actions";
import { revalidatePath } from "next/cache";

export async function archiveStaff(formData: FormData) {
  const school = await requireCurrentSchool();
  const actor = await requireRole(["school_owner", "school_admin", "principal", "headteacher"], school.id);
  const staffId = String(formData.get("staffId") ?? "");
  const [member] = await db.update(staff).set({ status: "inactive", updatedAt: new Date() }).where(and(eq(staff.id, staffId), eq(staff.schoolId, school.id))).returning({ email: staff.email });
  if (!member) throw new Error("Staff record not found.");
  if (member.email) {
    const [matchingUser] = await db.select({ id: users.id }).from(users).where(eq(users.email, member.email.toLowerCase())).limit(1);
    if (matchingUser) await db.update(schoolMemberships).set({ isActive: false, updatedAt: new Date() }).where(and(eq(schoolMemberships.userId, matchingUser.id), eq(schoolMemberships.schoolId, school.id)));
  }

  await writeAuditLog({
    schoolId: school.id,
    actorAuthUserId: actor.authUserId ?? actor.id,
    action: "staff_archived",
    entity: "staff",
    entityId: staffId,
  });
  revalidatePath(`/staff/${staffId}`);
  revalidatePath("/staff");
}

export async function deleteStaff(formData: FormData) {
  const school = await requireCurrentSchool();
  const actor = await requireRole(["school_owner", "school_admin", "principal"], school.id);
  const staffId = String(formData.get("staffId") ?? "");
  try {
    const [deleted] = await db
      .delete(staff)
      .where(and(eq(staff.id, staffId), eq(staff.schoolId, school.id)))
      .returning({ id: staff.id });
    if (!deleted) throw new Error("Staff record not found.");
    await writeAuditLog({
      schoolId: school.id,
      actorAuthUserId: actor.authUserId ?? actor.id,
      action: "staff_deleted",
      entity: "staff",
      entityId: staffId,
    });
    revalidatePath("/staff");
  } catch (error) {
    if (error instanceof Error && error.message === "Staff record not found.") throw error;
    throw new Error("This staff member has linked operational records and cannot be permanently deleted. Deactivate the record instead.");
  }
}

export async function getStaffAccountStatus(staffId: string) {
  const school = await requireCurrentSchool();
  const [member] = await db
    .select({ id: staff.id, email: staff.email })
    .from(staff)
    .where(and(eq(staff.id, staffId), eq(staff.schoolId, school.id)))
    .limit(1);
  if (!member) return null;
  if (!member.email) return { hasAccount: false } as const;

  const [userRow] = await db
    .select({
      id: users.id,
      status: users.status,
      firstName: users.firstName,
      lastName: users.lastName,
    })
    .from(users)
    .where(eq(users.email, member.email.toLowerCase()))
    .limit(1);

  if (userRow) {
    const [membership] = await db
      .select({ role: schoolMemberships.role, isActive: schoolMemberships.isActive })
      .from(schoolMemberships)
      .where(
        and(
          eq(schoolMemberships.userId, userRow.id),
          eq(schoolMemberships.schoolId, school.id),
        ),
      )
      .limit(1);
    return {
      hasAccount: true,
      user: userRow,
      membership: membership ?? null,
    };
  }

  const now = new Date();
  const [pendingInvitation] = await db
    .select({
      role: staffInvitations.role,
      expiresAt: staffInvitations.expiresAt,
      createdAt: staffInvitations.createdAt,
    })
    .from(staffInvitations)
    .where(
      and(
        eq(staffInvitations.email, member.email.toLowerCase()),
        eq(staffInvitations.schoolId, school.id),
        isNull(staffInvitations.acceptedAt),
      ),
    )
    .orderBy(desc(staffInvitations.createdAt))
    .limit(1);

  return {
    hasAccount: false,
    pendingInvitation:
      pendingInvitation && pendingInvitation.expiresAt > now
        ? pendingInvitation
        : null,
  };
}

const validStaffRoles = [
  "school_owner",
  "school_admin",
  "principal",
  "headteacher",
  "teacher",
  "accountant",
  "bursar",
  "secretary",
  "librarian",
  "nurse",
  "staff",
] as const;

export type InviteStaffAccountResult = {
  error?: string;
  success?: string;
  inviteUrl?: string;
};

export async function inviteStaffAccount(
  _prevState: InviteStaffAccountResult | null,
  formData: FormData,
): Promise<InviteStaffAccountResult> {
  const school = await requireCurrentSchool();
  const actor = await requireRole(
    [
      "super_admin",
      "platform_admin",
      "school_owner",
      "school_admin",
      "principal",
      "headteacher",
      "accountant",
      "bursar",
    ],
    school.id,
  );
  const staffId = String(formData.get("staffId") ?? "");
  const role = String(formData.get("role") ?? "teacher").trim();

  if (!validStaffRoles.includes(role as (typeof validStaffRoles)[number])) {
    return { error: "Invalid account role selected." };
  }

  const [member] = await db
    .select({
      id: staff.id,
      email: staff.email,
      firstName: staff.firstName,
      lastName: staff.lastName,
    })
    .from(staff)
    .where(and(eq(staff.id, staffId), eq(staff.schoolId, school.id)))
    .limit(1);

  if (!member) return { error: "Staff record not found." };
  if (!member.email) {
    return {
      error:
        "This staff member has no email address on file. Add an email to the staff profile before creating a login account.",
    };
  }

  const [userRow] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, member.email.toLowerCase()))
    .limit(1);

  if (userRow) {
    return { error: "This staff member already has a login account." };
  }

  let result: { success: boolean; inviteUrl: string; emailSent: boolean };

  try {
    result = await createStaffInvitation({
      email: member.email,
      firstName: member.firstName,
      lastName: member.lastName,
      role,
      schoolId: school.id,
    });
  } catch (error) {
    console.error("Failed to invite staff account:", error);
    return {
      error:
        "The invitation could not be created. Please check the details and try again.",
    };
  }

  await writeAuditLog({
    schoolId: school.id,
    actorAuthUserId: actor.authUserId ?? actor.id,
    action: "staff_account_invited",
    entity: "staff",
    entityId: staffId,
    metadata: { role, emailSent: result.emailSent },
  });

  revalidatePath(`/staff/${staffId}`);

  if (result.emailSent) {
    return {
      success:
        "Invitation email sent. The staff member will receive an email to create their password.",
    };
  }

  return {
    success:
      "Invitation created but the email could not be sent. Resend API is not configured — copy the link below and share it with the staff member manually.",
    inviteUrl: result.inviteUrl,
  };
}
