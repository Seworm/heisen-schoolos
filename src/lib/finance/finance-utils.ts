import { and, eq, sql } from "drizzle-orm";

import { db } from "@/db";
import {
  invoiceAdjustments,
  paymentAllocations,
  payments,
  studentInvoiceItems,
  studentInvoices,
} from "@/db/schema";

export type FinanceDb = Pick<typeof db, "select" | "update">;

export const INVOICE_STATUSES = [
  "draft",
  "issued",
  "partially_paid",
  "paid",
  "overdue",
  "cancelled",
] as const;

export const PAYMENT_METHODS = [
  "cash",
  "mobile_money",
  "bank_transfer",
  "card",
  "other",
] as const;

export const PAYMENT_STATUSES = [
  "posted",
  "reversed",
] as const;

export const ADJUSTMENT_TYPES = [
  "discount",
  "waiver",
  "surcharge",
] as const;

export const ADJUSTMENT_STATUSES = [
  "active",
  "cancelled",
] as const;

export type InvoiceStatus =
  (typeof INVOICE_STATUSES)[number];

export type PaymentMethod =
  (typeof PAYMENT_METHODS)[number];

export type PaymentStatus =
  (typeof PAYMENT_STATUSES)[number];

export type AdjustmentType =
  (typeof ADJUSTMENT_TYPES)[number];

export type AdjustmentStatus =
  (typeof ADJUSTMENT_STATUSES)[number];

export function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

export function requireUuid(
  value: string,
  fieldName: string,
) {
  if (!value || !isUuid(value)) {
    throw new Error(`${fieldName} is invalid.`);
  }

  return value;
}

export function parseMoney(
  value: string | number | null | undefined,
  fieldName = "Amount",
) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    throw new Error(`${fieldName} is required.`);
  }

  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    throw new Error(
      `${fieldName} must be a valid number.`,
    );
  }

  if (amount < 0) {
    throw new Error(
      `${fieldName} cannot be negative.`,
    );
  }

  return amount.toFixed(2);
}

export function parsePositiveMoney(
  value: string | number | null | undefined,
  fieldName = "Amount",
) {
  const amount = parseMoney(value, fieldName);

  if (Number(amount) <= 0) {
    throw new Error(
      `${fieldName} must be greater than zero.`,
    );
  }

  return amount;
}

export function parsePercentage(
  value: string | number | null | undefined,
  fieldName = "Percentage",
) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    throw new Error(`${fieldName} is required.`);
  }

  const percentage = Number(value);

  if (!Number.isFinite(percentage)) {
    throw new Error(
      `${fieldName} must be a valid number.`,
    );
  }

  if (percentage < 0 || percentage > 100) {
    throw new Error(
      `${fieldName} must be between 0 and 100.`,
    );
  }

  return percentage.toFixed(2);
}

export function normaliseText(
  value: string | null | undefined,
) {
  const text = value?.trim();

  return text || null;
}

export function requireText(
  value: string | null | undefined,
  fieldName: string,
) {
  const text = value?.trim();

  if (!text) {
    throw new Error(`${fieldName} is required.`);
  }

  return text;
}

export function assertDate(
  value: string,
  fieldName: string,
) {
  if (!value) {
    throw new Error(`${fieldName} is invalid.`);
  }

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    throw new Error(`${fieldName} is invalid.`);
  }

  return value;
}

export function today() {
  return new Date().toISOString().slice(0, 10);
}

function isPastDue(
  dueDate: string | Date | null,
  now = new Date(),
) {
  if (!dueDate) {
    return false;
  }

  const due = new Date(
    typeof dueDate === "string"
      ? `${dueDate.slice(0, 10)}T23:59:59.999`
      : dueDate,
  );

  if (Number.isNaN(due.getTime())) {
    return false;
  }

  return due.getTime() < now.getTime();
}

export async function getInvoiceFinancials(
  invoiceId: string,
  schoolId: string,
  database: FinanceDb = db,
) {
  const [invoice] = await database
    .select({
      id: studentInvoices.id,
      status: studentInvoices.status,
      dueDate: studentInvoices.dueDate,
    })
    .from(studentInvoices)
    .where(
      and(
        eq(studentInvoices.id, invoiceId),
        eq(studentInvoices.schoolId, schoolId),
      ),
    )
    .limit(1);

  if (!invoice) {
    throw new Error("Invoice not found.");
  }

  const [itemTotals] = await database
    .select({
      subtotal:
        sql<string>`
          coalesce(
            sum(${studentInvoiceItems.amount}),
            0
          )
        `,
    })
    .from(studentInvoiceItems)
    .where(
      eq(
        studentInvoiceItems.invoiceId,
        invoiceId,
      ),
    );

  const [adjustmentTotals] = await database
    .select({
      discounts:
        sql<string>`
          coalesce(
            sum(
              case
                when
                  ${invoiceAdjustments.type} in (
                    'discount',
                    'waiver'
                  )
                  and
                  ${invoiceAdjustments.status} = 'active'
                then ${invoiceAdjustments.amount}
                else 0
              end
            ),
            0
          )
        `,

      surcharges:
        sql<string>`
          coalesce(
            sum(
              case
                when
                  ${invoiceAdjustments.type} = 'surcharge'
                  and
                  ${invoiceAdjustments.status} = 'active'
                then ${invoiceAdjustments.amount}
                else 0
              end
            ),
            0
          )
        `,
    })
    .from(invoiceAdjustments)
    .where(
      eq(
        invoiceAdjustments.invoiceId,
        invoiceId,
      ),
    );

  const [paymentTotals] = await database
    .select({
      paid:
        sql<string>`
          coalesce(
            sum(
              case
                when ${payments.status} = 'posted'
                then ${paymentAllocations.amount}
                else 0
              end
            ),
            0
          )
        `,
    })
    .from(paymentAllocations)
    .innerJoin(
      payments,
      eq(
        payments.id,
        paymentAllocations.paymentId,
      ),
    )
    .where(
      eq(
        paymentAllocations.invoiceId,
        invoiceId,
      ),
    );

  const subtotal = Number(
    itemTotals?.subtotal ?? 0,
  );

  const discounts = Number(
    adjustmentTotals?.discounts ?? 0,
  );

  const surcharges = Number(
    adjustmentTotals?.surcharges ?? 0,
  );

  const paid = Number(
    paymentTotals?.paid ?? 0,
  );

  const total = Math.max(
    0,
    subtotal + surcharges - discounts,
  );

  const balance = Math.max(
    0,
    total - paid,
  );

  /*
   * Status is derived from the authoritative financial
   * position, while preserving draft/cancelled states.
   */
  const status = calculateInvoiceStatusFromFinancials({
    currentStatus: invoice.status,
    balance,
    paid,
    dueDate: invoice.dueDate,
  });

  return {
    invoiceId,
    status,
    subtotal,
    discounts,
    surcharges,
    total,
    paid,
    balance,
    dueDate: invoice.dueDate,
  };
}

function calculateInvoiceStatusFromFinancials({
  currentStatus,
  balance,
  paid,
  dueDate,
  now = new Date(),
}: {
  currentStatus: InvoiceStatus;
  balance: number;
  paid: number;
  dueDate: string | Date | null;
  now?: Date;
}): InvoiceStatus {
  /*
   * Draft invoices remain draft until explicitly issued.
   */
  if (currentStatus === "draft") {
    return "draft";
  }

  /*
   * Cancelled invoices never become active again
   * through financial calculations.
   */
  if (currentStatus === "cancelled") {
    return "cancelled";
  }

  /*
   * A zero balance always means the invoice is paid.
   */
  if (balance <= 0.005) {
    return "paid";
  }

  /*
   * An unpaid balance past the due date is overdue,
   * regardless of whether a partial payment has been made.
   */
  if (isPastDue(dueDate, now)) {
    return "overdue";
  }

  /*
   * A positive balance with a payment already posted
   * is partially paid.
   */
  if (paid > 0.005) {
    return "partially_paid";
  }

  /*
   * Otherwise the invoice is issued and outstanding.
   */
  return "issued";
}

export async function calculateInvoiceStatus(
  invoiceId: string,
  schoolId: string,
  database: FinanceDb = db,
): Promise<InvoiceStatus> {
  const financials =
    await getInvoiceFinancials(
      invoiceId,
      schoolId,
      database,
    );

  return financials.status;
}

export async function refreshInvoiceStatus(
  invoiceId: string,
  schoolId: string,
  database: FinanceDb = db,
) {
  const status =
    await calculateInvoiceStatus(
      invoiceId,
      schoolId,
      database,
    );

  await database
    .update(studentInvoices)
    .set({
      status,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(
          studentInvoices.id,
          invoiceId,
        ),
        eq(
          studentInvoices.schoolId,
          schoolId,
        ),
      ),
    );

  return status;
}