"use server";

import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { schools } from "@/db/schema";
import { requireSuperAdmin } from "@/lib/authorization";
import { writeAuditLog } from "@/lib/audit";

const schoolIdSchema = z.string().uuid();

export async function suspendSchool(schoolId: string) {
  const actor = await requireSuperAdmin();
  const id = schoolIdSchema.parse(schoolId);
  const [school] = await db
    .update(schools)
    .set({ status: "suspended", updatedAt: new Date() })
    .where(and(eq(schools.id, id), eq(schools.status, "active")))
    .returning({ id: schools.id, name: schools.name });

  if (!school) {
    throw new Error("Only an active school can be suspended.");
  }

  await writeAuditLog({
    schoolId: school.id,
    actorAuthUserId: actor.authUserId ?? actor.id,
    action: "school_suspended",
    entity: "school",
    entityId: school.id,
    metadata: { reason: "subscription_not_renewed" },
  });

  return { success: true };
}

export async function restoreSchool(schoolId: string) {
  const actor = await requireSuperAdmin();
  const id = schoolIdSchema.parse(schoolId);
  const [school] = await db
    .update(schools)
    .set({ status: "active", updatedAt: new Date() })
    .where(and(eq(schools.id, id), eq(schools.status, "suspended")))
    .returning({ id: schools.id, name: schools.name });

  if (!school) {
    throw new Error("Only a suspended school can be restored.");
  }

  await writeAuditLog({
    schoolId: school.id,
    actorAuthUserId: actor.authUserId ?? actor.id,
    action: "school_restored",
    entity: "school",
    entityId: school.id,
    metadata: { reason: "subscription_renewed" },
  });

  return { success: true };
}
