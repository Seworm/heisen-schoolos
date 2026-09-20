import { and, eq, sql } from "drizzle-orm";

import { db } from "@/db";
import {
  paymentAllocations,
  payments,
  studentInvoices,
  students,
} from "@/db/schema";

import {
  getInvoiceFinancials,
  parsePositiveMoney,
  requireUuid,
  today,
  type PaymentMethod,
} from "./finance-utils";

function generateReceiptNumber() {
  const year = new Date().getFullYear();
  const random = Math.floor(100000 + Math.random() * 900000);

  return `RCT-${year}-${random}`;
}

export async function recordPayment(input: {
  schoolId: string;
  studentId: string;
  amount: string | number;
  method: PaymentMethod;
  paymentDate?: string;
  reference?: string;
  notes?: string;
  allocations: Array<{
    invoiceId: string;
    amount: string | number;
  }>;
}) {
  const schoolId = requireUuid(input.schoolId, "School");
  const studentId = requireUuid(input.studentId, "Student");

  const amount = Number(
    parsePositiveMoney(
      input.amount,
      "Payment amount",
    ),
  );

  if (!input.allocations.length) {
    throw new Error(
      "At least one invoice allocation is required.",
    );
  }

  const [student] = await db
    .select({
      id: students.id,
    })
    .from(students)
    .where(
      and(
        eq(students.id, studentId),
        eq(students.schoolId, schoolId),
      ),
    )
    .limit(1);

  if (!student) {
    throw new Error("Student not found.");
  }

  const allocationAmounts =
    input.allocations.map((allocation) => ({
      invoiceId: requireUuid(
        allocation.invoiceId,
        "Invoice",
      ),
      amount: Number(
        parsePositiveMoney(
          allocation.amount,
          "Allocation amount",
        ),
      ),
    }));

  const allocatedTotal =
    allocationAmounts.reduce(
      (sum, allocation) =>
        sum + allocation.amount,
      0,
    );

  if (
    Math.abs(
      allocatedTotal - amount,
    ) > 0.005
  ) {
    throw new Error(
      "Payment amount must equal the total amount allocated to invoices.",
    );
  }

  const invoiceIds =
    allocationAmounts.map(
      (allocation) =>
        allocation.invoiceId,
    );

  if (
    new Set(invoiceIds).size !==
    invoiceIds.length
  ) {
    throw new Error(
      "An invoice cannot appear more than once in the same payment.",
    );
  }

  return db.transaction(async (tx) => {
    const invoices = await tx
      .select({
        id: studentInvoices.id,
        studentId:
          studentInvoices.studentId,
        status:
          studentInvoices.status,
      })
      .from(studentInvoices)
      .where(
        and(
          eq(
            studentInvoices.schoolId,
            schoolId,
          ),
          eq(
            studentInvoices.studentId,
            studentId,
          ),
          sql`${studentInvoices.id} in (${sql.join(
            invoiceIds.map(
              (id) => sql`${id}::uuid`,
            ),
            sql`, `,
          )})`,
        ),
      );

    if (
      invoices.length !==
      invoiceIds.length
    ) {
      throw new Error(
        "One or more invoices do not belong to this student or school.",
      );
    }

    for (const allocation of allocationAmounts) {
      const financials =
        await getInvoiceFinancials(
          allocation.invoiceId,
          schoolId,
          tx,
        );

      if (
        financials.status ===
          "cancelled" ||
        financials.status === "draft"
      ) {
        throw new Error(
          `Invoice ${allocation.invoiceId} cannot receive a payment.`,
        );
      }

      if (
        allocation.amount >
        financials.balance + 0.005
      ) {
        throw new Error(
          `Allocation exceeds the outstanding balance of invoice ${allocation.invoiceId}.`,
        );
      }
    }

    const receiptNumber =
      generateReceiptNumber();

    const [payment] = await tx
      .insert(payments)
      .values({
        schoolId,
        studentId,
        receiptNumber,
        paymentDate:
          input.paymentDate ?? today(),
        amount: amount.toFixed(2),
        method: input.method,
        reference:
          input.reference?.trim() || null,
        status: "posted",
        notes:
          input.notes?.trim() || null,
      })
      .returning();

    if (!payment) {
      throw new Error(
        "Failed to record payment.",
      );
    }

    await tx
      .insert(paymentAllocations)
      .values(
        allocationAmounts.map(
          (allocation) => ({
            paymentId: payment.id,
            invoiceId:
              allocation.invoiceId,
            amount:
              allocation.amount.toFixed(
                2,
              ),
          }),
        ),
      );

    /*
     * Recalculate every affected invoice from
     * the authoritative financial state.
     *
     * This is important because the invoice may
     * become paid, partially paid or remain overdue.
     */
    for (const allocation of allocationAmounts) {
      const financials =
        await getInvoiceFinancials(
          allocation.invoiceId,
          schoolId,
          tx,
        );

      await tx
        .update(studentInvoices)
        .set({
          status: financials.status,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(
              studentInvoices.id,
              allocation.invoiceId,
            ),
            eq(
              studentInvoices.schoolId,
              schoolId,
            ),
          ),
        );
    }

    return payment;
  });
}

export async function reversePayment(
  schoolId: string,
  paymentId: string,
) {
  requireUuid(schoolId, "School");
  requireUuid(paymentId, "Payment");

  return db.transaction(async (tx) => {
    const [payment] = await tx
      .select()
      .from(payments)
      .where(
        and(
          eq(payments.id, paymentId),
          eq(
            payments.schoolId,
            schoolId,
          ),
        ),
      )
      .limit(1);

    if (!payment) {
      throw new Error(
        "Payment not found.",
      );
    }

    if (
      payment.status === "reversed"
    ) {
      throw new Error(
        "Payment has already been reversed.",
      );
    }

    const allocations =
      await tx
        .select({
          invoiceId:
            paymentAllocations.invoiceId,
        })
        .from(paymentAllocations)
        .where(
          eq(
            paymentAllocations.paymentId,
            paymentId,
          ),
        );

    await tx
      .update(payments)
      .set({
        status: "reversed",
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(
            payments.id,
            paymentId,
          ),
          eq(
            payments.schoolId,
            schoolId,
          ),
        ),
      );

    /*
     * Recalculate invoice status after the
     * payment has been reversed.
     *
     * This correctly restores:
     * issued
     * partially_paid
     * overdue
     * paid
     */
    for (const allocation of allocations) {
      const financials =
        await getInvoiceFinancials(
          allocation.invoiceId,
          schoolId,
          tx,
        );

      await tx
        .update(studentInvoices)
        .set({
          status: financials.status,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(
              studentInvoices.id,
              allocation.invoiceId,
            ),
            eq(
              studentInvoices.schoolId,
              schoolId,
            ),
          ),
        );
    }

    return true;
  });
}