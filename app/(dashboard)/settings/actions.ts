"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { schoolSettings, schools } from "@/db/schema";
import { requireCurrentSchool } from "@/lib/current-school";
import { requireRole } from "@/lib/authorization";
import { writeAuditLog } from "@/lib/audit";

const schema = z.object({
  attendanceRate: z.coerce.number().min(0).max(100),
  assessmentAverage: z.coerce.number().min(0).max(100),
  minimumAssessments: z.coerce.number().int().min(1).max(20),
  lookbackMonths: z.coerce.number().int().min(1).max(24),
});

const schoolProfileSchema = z.object({
  name: z.string().trim().min(2).max(200),
  schoolCode: z.string().trim().min(2).max(50),
  schoolType: z.enum(["private_basic", "public_basic", "international", "montessori", "faith_based", "other"]),
  region: z.string().trim().max(100),
  district: z.string().trim().max(100),
  town: z.string().trim().max(100),
  address: z.string().trim().max(500),
  phone: z.string().trim().max(30),
  email: z.string().trim().email().max(255).or(z.literal("")),
  website: z.string().trim().url().max(255).or(z.literal("")),
  logoUrl: z.string().trim().url().max(500).or(z.literal("")),
});

const operationalSchema = z.object({
  currency: z.enum(["GHS", "USD", "GBP", "EUR"]),
  timezone: z.string().trim().min(1).max(64),
  enableRanking: z.coerce.boolean().default(false),
  enableSubjectRanking: z.coerce.boolean().default(false),
  allowOverpayment: z.coerce.boolean().default(false),
  nextTermReopeningDate: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/).or(z.literal("")),
  reportCardFooter: z.string().trim().max(500),
});

export async function updateSchoolProfile(formData: FormData) {
  const school = await requireCurrentSchool();
  const actor = await requireRole(["school_admin", "school_owner", "principal", "headteacher"], school.id);
  const values = schoolProfileSchema.parse(Object.fromEntries(formData.entries()));

  await db.update(schools).set({
    name: values.name,
    schoolCode: values.schoolCode,
    schoolType: values.schoolType,
    region: values.region || null,
    district: values.district || null,
    town: values.town || null,
    address: values.address || null,
    phone: values.phone || null,
    email: values.email || null,
    website: values.website || null,
    logoUrl: values.logoUrl || null,
    updatedAt: new Date(),
  }).where(eq(schools.id, school.id));
  await writeAuditLog({
    schoolId: school.id,
    actorAuthUserId: actor.authUserId ?? actor.id,
    action: "school_profile_updated",
    entity: "school",
    entityId: school.id,
  });
  revalidatePath("/settings");
  revalidatePath("/dashboard");
}

export async function updateOperationalSettings(formData: FormData) {
  const school = await requireCurrentSchool();
  const actor = await requireRole(["school_admin", "school_owner", "principal", "headteacher"], school.id);
  const values = operationalSchema.parse(Object.fromEntries(formData.entries()));

  await db.insert(schoolSettings).values({
    schoolId: school.id,
    currency: values.currency,
    timezone: values.timezone,
    enableRanking: values.enableRanking,
    enableSubjectRanking: values.enableSubjectRanking,
    allowOverpayment: values.allowOverpayment,
    nextTermReopeningDate: values.nextTermReopeningDate || null,
    reportCardFooter: values.reportCardFooter || null,
  }).onConflictDoUpdate({
    target: schoolSettings.schoolId,
    set: {
      currency: values.currency,
      timezone: values.timezone,
      enableRanking: values.enableRanking,
      enableSubjectRanking: values.enableSubjectRanking,
      allowOverpayment: values.allowOverpayment,
      nextTermReopeningDate: values.nextTermReopeningDate || null,
      reportCardFooter: values.reportCardFooter || null,
      updatedAt: new Date(),
    },
  });
  await writeAuditLog({
    schoolId: school.id,
    actorAuthUserId: actor.authUserId ?? actor.id,
    action: "school_operational_settings_updated",
    entity: "school_settings",
    entityId: school.id,
  });
  revalidatePath("/settings");
}

export async function updateInsightThresholds(formData: FormData) {
  const school = await requireCurrentSchool();
  const actor = await requireRole(["school_admin", "school_owner", "principal", "headteacher"], school.id);
  const values = schema.parse(Object.fromEntries(formData.entries()));
  const [existing] = await db.select({ metadata: schoolSettings.metadata }).from(schoolSettings).where(eq(schoolSettings.schoolId, school.id)).limit(1);
  const metadata = { ...(existing?.metadata ?? {}), insights: values };
  await db.insert(schoolSettings).values({ schoolId: school.id, metadata }).onConflictDoUpdate({
    target: schoolSettings.schoolId,
    set: { metadata, updatedAt: new Date() },
  });
  await writeAuditLog({
    schoolId: school.id,
    actorAuthUserId: actor.authUserId ?? actor.id,
    action: "school_insight_thresholds_updated",
    entity: "school_settings",
    entityId: school.id,
  });
  revalidatePath("/settings");
  revalidatePath("/reports");
}
