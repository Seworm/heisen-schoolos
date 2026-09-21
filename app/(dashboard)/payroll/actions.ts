"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import {
  payrollItems,
  payrollPeriods,
  payrollProfiles,
  payrollRuns,
  staff,
} from "@/db/schema";
import { requireRole } from "@/lib/authorization";
import { getCurrentSchool } from "@/lib/current-school";
import { writeAuditLog } from "@/lib/audit";

const money = z.coerce.number().finite().min(0).max(99_999_999.99);

export async function savePayrollProfile(formData: FormData) {
  const actor = await requireRole([
    "super_admin",
    "platform_admin",
    "school_owner",
    "school_admin",
    "principal",
    "headteacher",
    "accountant",
    "bursar",
  ]);
  const school = await getCurrentSchool();
  const data = z
    .object({
      staffId: z.string().uuid(),
      frequency: z.enum(["monthly", "weekly", "hourly"]),
      baseSalary: money,
      allowances: money,
      taxDeduction: money,
      pensionDeduction: money,
      otherDeduction: money,
      bankName: z.string().trim().max(120).optional(),
      bankAccountNumber: z.string().trim().max(80).optional(),
    })
    .parse({
      staffId: formData.get("staffId"),
      frequency: formData.get("frequency"),
      baseSalary: formData.get("baseSalary"),
      allowances: formData.get("allowances"),
      taxDeduction: formData.get("taxDeduction"),
      pensionDeduction: formData.get("pensionDeduction"),
      otherDeduction: formData.get("otherDeduction"),
      bankName: formData.get("bankName") || undefined,
      bankAccountNumber: formData.get("bankAccountNumber") || undefined,
    });

  const [staffMember] = await db
    .select({ id: staff.id })
    .from(staff)
    .where(and(eq(staff.id, data.staffId), eq(staff.schoolId, school.id)))
    .limit(1);
  if (!staffMember) throw new Error("Staff member does not belong to this school.");

  await db
    .insert(payrollProfiles)
    .values({
      schoolId: school.id,
      staffId: data.staffId,
      frequency: data.frequency,
      baseSalary: data.baseSalary.toFixed(2),
      allowances: data.allowances.toFixed(2),
      taxDeduction: data.taxDeduction.toFixed(2),
      pensionDeduction: data.pensionDeduction.toFixed(2),
      otherDeduction: data.otherDeduction.toFixed(2),
      bankName: data.bankName || null,
      bankAccountNumber: data.bankAccountNumber || null,
    })
    .onConflictDoUpdate({
      target: [payrollProfiles.schoolId, payrollProfiles.staffId],
      set: {
        frequency: data.frequency,
        baseSalary: data.baseSalary.toFixed(2),
        allowances: data.allowances.toFixed(2),
        taxDeduction: data.taxDeduction.toFixed(2),
        pensionDeduction: data.pensionDeduction.toFixed(2),
        otherDeduction: data.otherDeduction.toFixed(2),
        bankName: data.bankName || null,
        bankAccountNumber: data.bankAccountNumber || null,
        updatedAt: new Date(),
      },
    });

  await writeAuditLog({
    schoolId: school.id,
    actorAuthUserId: actor.authUserId ?? actor.id,
    action: "payroll_profile_saved",
    entity: "payroll_profile",
    entityId: data.staffId,
  });
  revalidatePath("/payroll");
}

export async function createPayrollPeriod(formData: FormData) {
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
  const data = z
    .object({
      name: z.string().trim().min(2).max(100),
      periodStart: z.string().date(),
      periodEnd: z.string().date(),
      payDate: z.string().date(),
    })
    .parse({
      name: formData.get("name"),
      periodStart: formData.get("periodStart"),
      periodEnd: formData.get("periodEnd"),
      payDate: formData.get("payDate"),
    });
  if (data.periodEnd < data.periodStart) throw new Error("Payroll period end must be after its start.");

  const [period] = await db
    .insert(payrollPeriods)
    .values({ schoolId: school.id, ...data })
    .returning({ id: payrollPeriods.id });
  if (!period) throw new Error("Payroll period could not be created.");

  await writeAuditLog({
    schoolId: school.id,
    actorAuthUserId: actor.authUserId ?? actor.id,
    action: "payroll_period_created",
    entity: "payroll_period",
    entityId: period.id,
  });
  revalidatePath("/payroll");
}

export async function processPayroll(formData: FormData) {
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
    .select()
    .from(payrollPeriods)
    .where(and(eq(payrollPeriods.id, periodId), eq(payrollPeriods.schoolId, school.id)))
    .limit(1);
  if (!period) throw new Error("Payroll period was not found.");
  if (period.status !== "draft") throw new Error("Only draft payroll periods can be processed.");

  const activeStaff = await db
    .select({
      id: staff.id,
      firstName: staff.firstName,
      lastName: staff.lastName,
      profile: payrollProfiles,
    })
    .from(staff)
    .leftJoin(
      payrollProfiles,
      and(eq(payrollProfiles.staffId, staff.id), eq(payrollProfiles.schoolId, school.id)),
    )
    .where(and(eq(staff.schoolId, school.id), eq(staff.status, "active")));

  const missingProfile = activeStaff.find((member) => !member.profile);
  if (missingProfile) {
    throw new Error(
      `Payroll profile missing for ${missingProfile.firstName} ${missingProfile.lastName}. Configure every active staff member before processing.`,
    );
  }

  const [existingRun] = await db
    .select({ id: payrollRuns.id })
    .from(payrollRuns)
    .where(eq(payrollRuns.periodId, period.id))
    .limit(1);
  if (existingRun) throw new Error("This payroll period has already been processed.");

  const calculations = activeStaff.map(({ profile, id }) => {
    const baseSalary = Number(profile!.baseSalary);
    const allowances = Number(profile!.allowances);
    const taxDeduction = Number(profile!.taxDeduction);
    const pensionDeduction = Number(profile!.pensionDeduction);
    const otherDeduction = Number(profile!.otherDeduction);
    const grossPay = baseSalary + allowances;
    const totalDeductions = taxDeduction + pensionDeduction + otherDeduction;
    return {
      staffId: id,
      baseSalary: baseSalary.toFixed(2),
      allowances: allowances.toFixed(2),
      grossPay: grossPay.toFixed(2),
      taxDeduction: taxDeduction.toFixed(2),
      pensionDeduction: pensionDeduction.toFixed(2),
      otherDeduction: otherDeduction.toFixed(2),
      totalDeductions: totalDeductions.toFixed(2),
      netPay: (grossPay - totalDeductions).toFixed(2),
      gross: grossPay,
      deductions: totalDeductions,
      net: grossPay - totalDeductions,
    };
  });

  await db.transaction(async (tx) => {
    const [run] = await tx
      .insert(payrollRuns)
      .values({
        schoolId: school.id,
        periodId: period.id,
        grossTotal: calculations.reduce((sum, item) => sum + item.gross, 0).toFixed(2),
        deductionsTotal: calculations.reduce((sum, item) => sum + item.deductions, 0).toFixed(2),
        netTotal: calculations.reduce((sum, item) => sum + item.net, 0).toFixed(2),
        processedBy: actor.authUserId ?? actor.id,
        processedAt: new Date(),
      })
      .returning({ id: payrollRuns.id });
    if (!run) throw new Error("Payroll run could not be created.");

    await tx.insert(payrollItems).values(
      calculations.map((item) => ({
        runId: run.id,
        schoolId: school.id,
        staffId: item.staffId,
        baseSalary: item.baseSalary,
        allowances: item.allowances,
        grossPay: item.grossPay,
        taxDeduction: item.taxDeduction,
        pensionDeduction: item.pensionDeduction,
        otherDeduction: item.otherDeduction,
        totalDeductions: item.totalDeductions,
        netPay: item.netPay,
      })),
    );
    await tx
      .update(payrollPeriods)
      .set({ status: "processed", updatedAt: new Date() })
      .where(eq(payrollPeriods.id, period.id));
  });

  await writeAuditLog({
    schoolId: school.id,
    actorAuthUserId: actor.authUserId ?? actor.id,
    action: "payroll_processed",
    entity: "payroll_period",
    entityId: period.id,
    metadata: { staffCount: calculations.length },
  });
  revalidatePath("/payroll");
}
