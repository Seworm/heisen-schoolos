"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { payrollItems, payrollPeriods, payrollRuns } from "@/db/schema";
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

export async function deletePayrollEntry(formData: FormData) {
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
  const staffId = z.string().uuid().parse(formData.get("staffId"));

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
    throw new Error("Only processed payroll periods can be edited.");
  }

  const [run] = await db
    .select({ id: payrollRuns.id, grossTotal: payrollRuns.grossTotal, deductionsTotal: payrollRuns.deductionsTotal, netTotal: payrollRuns.netTotal })
    .from(payrollRuns)
    .where(
      and(
        eq(payrollRuns.periodId, period.id),
        eq(payrollRuns.schoolId, school.id),
      ),
    )
    .limit(1);

  if (!run) throw new Error("Payroll run was not found.");

  const [deletedEntry] = await db
    .delete(payrollItems)
    .where(
      and(
        eq(payrollItems.runId, run.id),
        eq(payrollItems.staffId, staffId),
        eq(payrollItems.schoolId, school.id),
      ),
    )
    .returning({
      id: payrollItems.id,
      baseSalary: payrollItems.baseSalary,
      allowances: payrollItems.allowances,
      grossPay: payrollItems.grossPay,
      taxDeduction: payrollItems.taxDeduction,
      pensionDeduction: payrollItems.pensionDeduction,
      otherDeduction: payrollItems.otherDeduction,
      totalDeductions: payrollItems.totalDeductions,
      netPay: payrollItems.netPay,
    });

  if (!deletedEntry) throw new Error("Payroll entry was not found.");

  const remainingItems = await db
    .select({
      baseSalary: payrollItems.baseSalary,
      allowances: payrollItems.allowances,
      grossPay: payrollItems.grossPay,
      taxDeduction: payrollItems.taxDeduction,
      pensionDeduction: payrollItems.pensionDeduction,
      otherDeduction: payrollItems.otherDeduction,
      totalDeductions: payrollItems.totalDeductions,
      netPay: payrollItems.netPay,
    })
    .from(payrollItems)
    .where(eq(payrollItems.runId, run.id));

  if (remainingItems.length === 0) {
    await db.delete(payrollRuns).where(eq(payrollRuns.id, run.id));
    await db
      .update(payrollPeriods)
      .set({ status: "draft", updatedAt: new Date() })
      .where(eq(payrollPeriods.id, period.id));
  } else {
    const grossTotal = remainingItems.reduce((sum, item) => sum + Number(item.grossPay), 0);
    const deductionsTotal = remainingItems.reduce((sum, item) => sum + Number(item.totalDeductions), 0);
    const netTotal = remainingItems.reduce((sum, item) => sum + Number(item.netPay), 0);

    await db
      .update(payrollRuns)
      .set({
        grossTotal: grossTotal.toFixed(2),
        deductionsTotal: deductionsTotal.toFixed(2),
        netTotal: netTotal.toFixed(2),
        processedBy: actor.authUserId ?? actor.id,
        processedAt: new Date(),
      })
      .where(eq(payrollRuns.id, run.id));
  }

  await writeAuditLog({
    schoolId: school.id,
    actorAuthUserId: actor.authUserId ?? actor.id,
    action: "payroll_entry_deleted",
    entity: "payroll_item",
    entityId: deletedEntry.id,
  });

  revalidatePath("/payroll");
  revalidatePath(`/payroll/${period.id}`);
}
