"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { schoolSettings } from "@/db/schema";
import { requireCurrentSchool } from "@/lib/current-school";
import { requireRole } from "@/lib/authorization";

const schema = z.object({
  attendanceRate: z.coerce.number().min(0).max(100),
  assessmentAverage: z.coerce.number().min(0).max(100),
  minimumAssessments: z.coerce.number().int().min(1).max(20),
  lookbackMonths: z.coerce.number().int().min(1).max(24),
});

export async function updateInsightThresholds(formData: FormData) {
  const school = await requireCurrentSchool();
  await requireRole(["school_admin", "school_owner", "principal", "headteacher"], school.id);
  const values = schema.parse(Object.fromEntries(formData.entries()));
  const [existing] = await db.select({ metadata: schoolSettings.metadata }).from(schoolSettings).where(eq(schoolSettings.schoolId, school.id)).limit(1);
  const metadata = { ...(existing?.metadata ?? {}), insights: values };
  await db.insert(schoolSettings).values({ schoolId: school.id, metadata }).onConflictDoUpdate({
    target: schoolSettings.schoolId,
    set: { metadata, updatedAt: new Date() },
  });
  revalidatePath("/settings");
  revalidatePath("/reports");
}
