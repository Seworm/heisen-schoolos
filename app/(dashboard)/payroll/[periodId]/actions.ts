"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { payrollPeriods } from "@/db/schema";
import { requireRole } from "@/lib/authorization";
import { getCurrentSchool } from "@/lib/current-school";
import { writeAuditLog } from "@/lib/audit";

export async function markPayrollAsPaid(formData: FormData) {
  const actor = await requireRole([
    "super_admin",
    "platform_admin",
    "school_owner",
    "school_admin",
    "principal",
    "accountant",
    "bursar",
  ]);
  const school = await getCurrentSchool();
  const periodId = z.string().uuid().parse(formData.get("periodId"));

  const [period] = await db
    .select({ id: payrollPeriods.id, status: payrollPeriods.status })
    .from(payrollPeriods)
    .where(
      and(
        eq(payrollPeriods.id, periodId),
        eq(payrollPeriods.schoolId, school.id),
      ),
    )
    .limit(1);

  if (!period) throw new Error("Payroll period was not found.");
  if (period.status !== "processed") {
    throw new Error("Only processed payroll periods can be marked as paid.");
  }

  await db
    .update(payrollPeriods)
    .set({ status: "paid", updatedAt: new Date() })
    .where(eq(payrollPeriods.id, period.id));

  await writeAuditLog({
    schoolId: school.id,
    actorAuthUserId: actor.authUserId ?? actor.id,
    action: "payroll_marked_paid",
    entity: "payroll_period",
    entityId: period.id,
  });
  revalidatePath("/payroll");
  revalidatePath(`/payroll/${period.id}`);
}
