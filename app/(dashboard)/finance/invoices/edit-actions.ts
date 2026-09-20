"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import {
  studentInvoiceItems,
  studentInvoices,
} from "@/db/schema";
import { getCurrentSchool } from "@/lib/current-school";
import {
  assertDate,
  normaliseText,
  parsePositiveMoney,
  requireUuid,
} from "@/lib/finance/finance-utils";

type InvoiceItemInput = {
  id: string;
  amount: string;
  description?: string;
};

export async function updateDraftInvoiceAction(
  formData: FormData,
) {
  const school = await getCurrentSchool();

  const invoiceId = requireUuid(
    String(formData.get("invoiceId") ?? ""),
    "Invoice",
  );

  const issueDate = assertDate(
    String(formData.get("issueDate") ?? ""),
    "Issue date",
  );

  const rawDueDate = String(
    formData.get("dueDate") ?? "",
  ).trim();

  const dueDate = rawDueDate
    ? assertDate(rawDueDate, "Due date")
    : null;

  if (dueDate && dueDate < issueDate) {
    throw new Error(
      "Due date cannot be earlier than the issue date.",
    );
  }

  const notes = normaliseText(
    String(formData.get("notes") ?? ""),
  );

  const rawItems = String(
    formData.get("items") ?? "[]",
  );

  let items: InvoiceItemInput[];

  try {
    items = JSON.parse(rawItems);
  } catch {
    throw new Error("Invoice items are invalid.");
  }

  if (!Array.isArray(items) || items.length === 0) {
    throw new Error(
      "An invoice must contain at least one item.",
    );
  }

  const normalisedItems = items.map((item) => ({
    id: requireUuid(item.id, "Invoice item"),
    amount: parsePositiveMoney(
      item.amount,
      "Invoice item amount",
    ),
    description: normaliseText(item.description),
  }));

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

  if (invoice.status !== "draft") {
    throw new Error(
      "Only draft invoices can be edited.",
    );
  }

  const existingItems = await db
    .select({
      id: studentInvoiceItems.id,
    })
    .from(studentInvoiceItems)
    .where(
      eq(studentInvoiceItems.invoiceId, invoiceId),
    );

  const existingIds = new Set(
    existingItems.map((item) => item.id),
  );

  for (const item of normalisedItems) {
    if (!existingIds.has(item.id)) {
      throw new Error(
        "One or more invoice items do not belong to this invoice.",
      );
    }
  }

  await db.transaction(async (tx) => {
    await tx
      .update(studentInvoices)
      .set({
        issueDate,
        dueDate,
        notes,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(studentInvoices.id, invoiceId),
          eq(studentInvoices.schoolId, school.id),
        ),
      );

    for (const item of normalisedItems) {
      await tx
        .update(studentInvoiceItems)
        .set({
          amount: item.amount,
          description: item.description ?? undefined,
        })
        .where(
          and(
            eq(studentInvoiceItems.id, item.id),
            eq(
              studentInvoiceItems.invoiceId,
              invoiceId,
            ),
          ),
        );
    }
  });

  revalidatePath("/finance");
  revalidatePath("/finance/invoices");
  revalidatePath(`/finance/invoices/${invoiceId}`);
  revalidatePath(`/finance/invoices/${invoiceId}/edit`);

  return {
    success: true,
    invoiceId,
  };
}

