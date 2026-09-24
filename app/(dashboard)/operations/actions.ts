"use server";

import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import {
  notifications, notificationAutomations, schoolCalendarEvents,
  staff, staffLeaveRequests, schoolMemberships, users,
} from "@/db/schema";
import { getApplicationSession } from "@/lib/auth/compat";
import { requireCurrentSchool } from "@/lib/current-school";
import { requireRole, SCHOOL_ADMIN_ROLES } from "@/lib/authorization";
import { writeAuditLog } from "@/lib/audit";

type State = { error?: string; success?: string } | null;

async function context() {
  const session = await getApplicationSession();
  if (!session?.user || session.user.accountType !== "staff") throw new Error("Staff access required.");
  const school = await requireCurrentSchool();
  if (session.user.schoolId !== school.id && !session.user.isPlatformAdmin) throw new Error("Wrong school.");
  return { user: session.user, school };
}

function required(form: FormData, key: string) {
  const value = String(form.get(key) ?? "").trim();
  if (!value) throw new Error(`${key} is required.`);
  return value;
}

export async function createCalendarEvent(_state: State, form: FormData): Promise<State> {
  try {
    const { user, school } = await context();
    const startsAt = new Date(required(form, "startsAt"));
    const endsAt = new Date(required(form, "endsAt"));
    if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime()) || endsAt < startsAt) throw new Error("Event dates are invalid.");
    await db.insert(schoolCalendarEvents).values({
      schoolId: school.id, title: required(form, "title"),
      description: String(form.get("description") ?? "").trim() || null,
      type: (String(form.get("type") || "other") as "holiday" | "academic" | "meeting" | "activity" | "deadline" | "other"),
      startsAt, endsAt, allDay: form.get("allDay") === "on", createdBy: user.id,
    });
    revalidatePath("/calendar");
    return { success: "Event created." };
  } catch (error) { return { error: error instanceof Error ? error.message : "Could not create event." }; }
}

export async function cancelCalendarEvent(form: FormData): Promise<void> {
  const { user, school } = await context();
  await requireRole(SCHOOL_ADMIN_ROLES, school.id);
  const id = required(form, "id");
  const [event] = await db.update(schoolCalendarEvents)
    .set({ status: "cancelled", updatedAt: new Date() })
    .where(and(
      eq(schoolCalendarEvents.id, id),
      eq(schoolCalendarEvents.schoolId, school.id),
      eq(schoolCalendarEvents.status, "scheduled"),
    ))
    .returning({ id: schoolCalendarEvents.id, title: schoolCalendarEvents.title });
  if (!event) throw new Error("Calendar event not found.");
  await writeAuditLog({
    schoolId: school.id,
    actorAuthUserId: user.id,
    action: "cancel",
    entity: "school_calendar_event",
    entityId: event.id,
    metadata: { title: event.title, status: "cancelled" },
  });
  revalidatePath("/calendar");
}

export async function requestStaffLeave(_state: State, form: FormData): Promise<State> {
  try {
    const { user, school } = await context();
    const staffId = required(form, "staffId");
    const [person] = await db.select({ id: staff.id }).from(staff).where(and(eq(staff.id, staffId), eq(staff.schoolId, school.id))).limit(1);
    if (!person) throw new Error("Staff member was not found.");
    const startsOn = required(form, "startsOn");
    const endsOn = required(form, "endsOn");
    if (endsOn < startsOn) throw new Error("End date must be on or after start date.");
    const [request] = await db.insert(staffLeaveRequests).values({
      schoolId: school.id, staffId, requestedBy: user.id,
      leaveType: (String(form.get("leaveType") || "annual") as "annual" | "sick" | "maternity" | "paternity" | "unpaid" | "other"),
      startsOn, endsOn, reason: String(form.get("reason") ?? "").trim() || null,
    }).returning({ id: staffLeaveRequests.id });
    const admins = await db.select({ id: users.id }).from(schoolMemberships).innerJoin(users, eq(users.id, schoolMemberships.userId)).where(and(eq(schoolMemberships.schoolId, school.id), eq(schoolMemberships.isActive, true), inArray(schoolMemberships.role, [...SCHOOL_ADMIN_ROLES])));
    if (admins.length) await db.insert(notifications).values(admins.map((admin) => ({ schoolId: school.id, recipientAuthUserId: admin.id, title: "Staff leave request", body: `${user.name} submitted leave for ${startsOn} to ${endsOn}.`, type: "leave_request" })));
    revalidatePath("/staff/leave");
    return { success: request ? "Leave request submitted for approval." : "Leave request submitted." };
  } catch (error) { return { error: error instanceof Error ? error.message : "Could not submit leave request." }; }
}

export async function reviewStaffLeave(form: FormData): Promise<void> {
  const { user, school } = await context();
  await requireRole(SCHOOL_ADMIN_ROLES, school.id);
  const id = required(form, "id");
  const status = String(form.get("status"));
  if (status !== "approved" && status !== "rejected") throw new Error("Invalid decision.");
  const [request] = await db.update(staffLeaveRequests).set({ status, reviewedBy: user.id, reviewedAt: new Date(), reviewNote: String(form.get("reviewNote") ?? "").trim() || null, updatedAt: new Date() }).where(and(eq(staffLeaveRequests.id, id), eq(staffLeaveRequests.schoolId, school.id), eq(staffLeaveRequests.status, "pending"))).returning({ requestedBy: staffLeaveRequests.requestedBy });
  if (request) await db.insert(notifications).values({ schoolId: school.id, recipientAuthUserId: request.requestedBy, title: `Leave request ${status}`, body: `Your staff leave request was ${status}.`, type: "leave_decision" });
  revalidatePath("/staff/leave");
}

export async function createNotificationAutomation(_state: State, form: FormData): Promise<State> {
  try {
    const { user, school } = await context();
    await requireRole(SCHOOL_ADMIN_ROLES, school.id);
    await db.insert(notificationAutomations).values({ schoolId: school.id, name: required(form, "name"), trigger: required(form, "trigger"), daysBefore: Number(form.get("daysBefore") || 1), createdBy: user.id });
    revalidatePath("/calendar");
    return { success: "Automation enabled." };
  } catch (error) { return { error: error instanceof Error ? error.message : "Could not enable automation." }; }
}

export async function createInventoryItemAction(formData: FormData): Promise<void> {
  const { user, school } = await context();
  await requireRole([...SCHOOL_ADMIN_ROLES, "librarian"], school.id);
  const { createInventoryItem } = await import("@/lib/inventory");
  const item = await createInventoryItem({ schoolId: school.id, sku: required(formData, "sku"), name: required(formData, "name"), category: String(formData.get("category") || "").trim() || undefined, unit: String(formData.get("unit") || "unit"), reorderLevel: Number(formData.get("reorderLevel") || 0) });
  revalidatePath("/operations/inventory");
  void item; void user;
}

export async function recordInventoryTransactionAction(formData: FormData): Promise<void> {
  const { user, school } = await context();
  await requireRole([...SCHOOL_ADMIN_ROLES, "librarian"], school.id);
  const { recordInventoryTransaction } = await import("@/lib/inventory");
  const transaction = await recordInventoryTransaction({ schoolId: school.id, itemId: required(formData, "itemId"), type: String(formData.get("type") || "receipt") as "receipt" | "issue" | "adjustment", quantity: Number(formData.get("quantity") || 0), actorId: user.id, reference: String(formData.get("reference") || "").trim() || undefined, notes: String(formData.get("notes") || "").trim() || undefined });
  revalidatePath("/operations/inventory");
  void transaction; void user;
}
