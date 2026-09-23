"use server";

import { revalidatePath } from "next/cache";
import { getCurrentSchool } from "@/lib/current-school";
import { collectDailyFeedingFee, saveFeedingFeeSetting, setStudentFeedingPaymentMode } from "@/lib/feeding-fees";

export async function saveFeedingSettingAction(formData: FormData) {
  const school = await getCurrentSchool();
  await saveFeedingFeeSetting({
    schoolId: school.id,
    academicYearId: String(formData.get("academicYearId") ?? ""),
    classLevelId: String(formData.get("classLevelId") ?? ""),
    dailyAmount: String(formData.get("dailyAmount") ?? ""),
    termlyAmount: String(formData.get("termlyAmount") ?? "") || null,
  });
  revalidatePath("/finance/feeding");
}

export async function collectDailyFeedingFeeAction(formData: FormData) {
  const school = await getCurrentSchool();
  await collectDailyFeedingFee({
    schoolId: school.id,
    studentId: String(formData.get("studentId") ?? ""),
    academicYearId: String(formData.get("academicYearId") ?? ""),
    collectionDate: String(formData.get("collectionDate") ?? ""),
    amount: String(formData.get("amount") ?? ""),
    method: String(formData.get("method") ?? "cash") as "cash",
    receiptNumber: String(formData.get("receiptNumber") ?? ""),
    notes: String(formData.get("notes") ?? ""),
  });
  revalidatePath("/finance/feeding");
  revalidatePath("/finance/feeding/collect");
}

export async function setStudentFeedingModeAction(formData: FormData) {
  const school = await getCurrentSchool();
  await setStudentFeedingPaymentMode({
    schoolId: school.id,
    studentId: String(formData.get("studentId") ?? ""),
    academicYearId: String(formData.get("academicYearId") ?? ""),
    mode: String(formData.get("mode") ?? "termly") as "daily" | "termly",
  });
  revalidatePath("/finance/feeding/collect");
}
