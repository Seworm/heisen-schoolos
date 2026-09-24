"use server";

import { revalidatePath } from "next/cache";
import { getCurrentSchool } from "@/lib/current-school";
import { createCashbookEntry, reverseCashbookEntry } from "@/lib/cashbook";

export async function createCashbookEntryAction(formData: FormData) {
  const school = await getCurrentSchool();
  await createCashbookEntry({
    schoolId: school.id,
    entryDate: String(formData.get("entryDate") ?? ""),
    entryType: String(formData.get("entryType") ?? "expense") as "income" | "expense",
    category: String(formData.get("category") ?? ""),
    description: String(formData.get("description") ?? ""),
    amount: String(formData.get("amount") ?? ""),
    method: String(formData.get("method") ?? "cash") as "cash" | "mobile_money" | "bank_transfer" | "card" | "other",
    reference: String(formData.get("reference") ?? ""),
  });
  revalidatePath("/finance/cashbook");
}

export async function reverseCashbookEntryAction(formData: FormData) {
  const school = await getCurrentSchool();
  await reverseCashbookEntry({
    schoolId: school.id,
    entryId: String(formData.get("entryId") ?? ""),
    reason: String(formData.get("reason") ?? ""),
  });
  revalidatePath("/finance/cashbook");
}
