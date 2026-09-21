"use server";

import { revalidatePath } from "next/cache";
import { getCurrentSchool } from "@/lib/current-school";
import { createPaymentIntent, verifyPaymentIntent } from "@/lib/payments/service";
import type { PaymentProviderName } from "@/lib/payments/provider";
import type { PaymentMethod } from "@/lib/finance/finance-utils";

function parseAllocations(value: string) {
  const parsed: unknown = JSON.parse(value || "[]");
  if (!Array.isArray(parsed)) throw new Error("Payment allocations are invalid.");
  return parsed.map((item) => {
    if (!item || typeof item !== "object" || !("invoiceId" in item) || !("amount" in item)) {
      throw new Error("Payment allocations are invalid.");
    }
    return {
      invoiceId: String(item.invoiceId),
      amount: String(item.amount),
    };
  });
}

export async function createPaymentIntentAction(formData: FormData) {
  const school = await getCurrentSchool();
  const result = await createPaymentIntent({
    schoolId: school.id,
    studentId: String(formData.get("studentId") ?? ""),
    amount: String(formData.get("amount") ?? ""),
    allocations: parseAllocations(String(formData.get("allocations") ?? "[]")),
    provider: String(formData.get("provider") ?? "manual") as PaymentProviderName,
    paymentMethod: String(formData.get("method") ?? "other") as PaymentMethod,
  });
  revalidatePath("/finance");
  return { success: true, ...result };
}

export async function verifyPaymentIntentAction(formData: FormData) {
  const school = await getCurrentSchool();
  const result = await verifyPaymentIntent({
    schoolId: school.id,
    intentId: String(formData.get("intentId") ?? ""),
    providerTransactionId: String(formData.get("providerTransactionId") ?? ""),
  });
  revalidatePath("/finance");
  revalidatePath("/finance/payments");
  return { success: true, ...result };
}
