"use server";

import { revalidatePath } from "next/cache";
import { getCurrentSchool } from "@/lib/current-school";
import { assignScholarship, createScholarship } from "@/lib/scholarships";

export async function createScholarshipAction(formData: FormData) {
  const school = await getCurrentSchool();
  await createScholarship({ schoolId: school.id, name: String(formData.get("name") ?? ""), percentage: String(formData.get("percentage") ?? ""), maxAmount: String(formData.get("maxAmount") ?? "") || undefined });
  revalidatePath("/finance/scholarships");
}

export async function assignScholarshipAction(formData: FormData) {
  const school = await getCurrentSchool();
  await assignScholarship({ schoolId: school.id, studentId: String(formData.get("studentId") ?? ""), scholarshipId: String(formData.get("scholarshipId") ?? ""), academicYearId: String(formData.get("academicYearId") ?? ""), termId: String(formData.get("termId") ?? ""), amount: String(formData.get("amount") ?? "") || undefined });
  revalidatePath("/finance/scholarships");
}
