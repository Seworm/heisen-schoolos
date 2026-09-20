"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  invoiceAdjustments,
  studentInvoices,
} from "@/db/schema";
import { getCurrentSchool } from "@/lib/current-school";
import {
  getInvoiceFinancials,
  parsePositiveMoney,
  requireText,
  requireUuid,
  refreshInvoiceStatus,
} from "@/lib/finance/finance-utils";

export async function createInvoiceAdjustmentAction(
  formData: FormData,
) {
  const school = await getCurrentSchool();

  const invoiceId = requireUuid(
    String(formData.get("invoiceId") ?? ""),
    "Invoice",
  );

  const type = String(
    formData.get("type") ?? "",
  ) as "discount" | "waiver" | "surcharge";

  if (!["discount", "waiver", "surcharge"].includes(type)) {
    throw new Error("Invalid adjustment type.");
  }

  const amount = parsePositiveMoney(
    String(formData.get("amount") ?? ""),
    "Adjustment amount",
  );

  const reason = requireText(
    String(formData.get("reason") ?? ""),
    "Adjustment reason",
  );

  const [invoice] = await db
    .select({
      id: studentInvoices.id,
      status: studentInvoices.status,
    })
    .from(studentInvoices)
    .where(
      and(
        eq(studentInvoices.id, invoiceId),
        eq(studentInvoices.schoolId, school.id),
      ),
    )
    .limit(1);

  if (!invoice) {
    throw new Error("Invoice not found.");
  }

  if (
    invoice.status === "cancelled" ||
    invoice.status === "paid"
  ) {
    throw new Error(
      "Adjustments cannot be added to this invoice.",
    );
  }

  const financials = await getInvoiceFinancials(
    invoiceId,
    school.id,
  );

  if (
    (type === "discount" || type === "waiver") &&
    Number(amount) > financials.total
  ) {
    throw new Error(
      "Discount or waiver cannot exceed the invoice total.",
    );
  }

  const [adjustment] = await db
    .insert(invoiceAdjustments)
    .values({
      invoiceId,
      type,
      amount,
      reason,
      status: "active",
    })
    .returning();

  await refreshInvoiceStatus(
    invoiceId,
    school.id,
  );

  revalidatePath("/finance");
  revalidatePath("/finance/invoices");
  revalidatePath(`/finance/invoices/${invoiceId}`);

  return {
    success: true,
    adjustment,
  };
}

export async function cancelInvoiceAdjustmentAction(
  formData: FormData,
) {
  const school = await getCurrentSchool();

  const adjustmentId = requireUuid(
    String(formData.get("adjustmentId") ?? ""),
    "Adjustment",
  );

  const invoiceId = requireUuid(
    String(formData.get("invoiceId") ?? ""),
    "Invoice",
  );

  const [invoice] = await db
    .select({
      id: studentInvoices.id,
    })
    .from(studentInvoices)
    .where(
      and(
        eq(studentInvoices.id, invoiceId),
        eq(studentInvoices.schoolId, school.id),
      ),
    )
    .limit(1);

  if (!invoice) {
    throw new Error("Invoice not found.");
  }

  const [adjustment] = await db
    .update(invoiceAdjustments)
    .set({
      status: "cancelled",
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(invoiceAdjustments.id, adjustmentId),
        eq(invoiceAdjustments.invoiceId, invoiceId),
      ),
    )
    .returning();

  if (!adjustment) {
    throw new Error("Invoice adjustment not found.");
  }

  await refreshInvoiceStatus(
    invoiceId,
    school.id,
  );

  revalidatePath("/finance");
  revalidatePath("/finance/invoices");
  revalidatePath(`/finance/invoices/${invoiceId}`);

  return {
    success: true,
    adjustment,
  };
}

