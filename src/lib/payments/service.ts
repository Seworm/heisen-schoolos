import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  paymentIntents,
  paymentTransactions,
  students,
} from "@/db/schema";
import {
  parsePositiveMoney,
  requireUuid,
  type PaymentMethod,
} from "@/lib/finance/finance-utils";
import { recordPayment } from "@/lib/finance/payments";
import {
  getPaymentProvider,
  type PaymentProviderName,
} from "./provider";

type Allocation = { invoiceId: string; amount: string };

export async function createPaymentIntent(input: {
  schoolId: string;
  studentId: string;
  amount: string | number;
  allocations: Allocation[];
  provider?: PaymentProviderName;
  paymentMethod?: PaymentMethod;
  currency?: string;
}) {
  const schoolId = requireUuid(input.schoolId, "School");
  const studentId = requireUuid(input.studentId, "Student");
  const amount = parsePositiveMoney(input.amount, "Payment amount");
  const currency = (input.currency ?? "GHS").toUpperCase();
  if (currency !== "GHS") throw new Error("Only GHS payments are supported.");
  if (!input.allocations.length) throw new Error("At least one invoice allocation is required.");

  const [student] = await db
    .select({ id: students.id })
    .from(students)
    .where(and(eq(students.id, studentId), eq(students.schoolId, schoolId)))
    .limit(1);
  if (!student) throw new Error("Student not found.");

  const allocations = input.allocations.map((allocation) => ({
    invoiceId: requireUuid(allocation.invoiceId, "Invoice"),
    amount: parsePositiveMoney(allocation.amount, "Allocation amount"),
  }));
  const allocated = allocations.reduce((sum, item) => sum + Number(item.amount), 0);
  if (Math.abs(allocated - Number(amount)) > 0.005) {
    throw new Error("Payment amount must equal the total amount allocated to invoices.");
  }

  const provider = getPaymentProvider(input.provider);
  const clientReference = `PI-${randomUUID()}`;
  const providerIntent = await provider.createIntent({
    clientReference,
    amount,
    currency,
  });
  const [intent] = await db
    .insert(paymentIntents)
    .values({
      schoolId,
      studentId,
      amount,
      currency,
      provider: provider.name,
      clientReference,
      providerReference: providerIntent.providerReference,
      metadata: {
        allocations,
        paymentMethod: input.paymentMethod ?? "other",
      },
    })
    .returning();
  if (!intent) throw new Error("Failed to create payment intent.");
  return { intent, instructions: providerIntent.instructions };
}

export async function verifyPaymentIntent(input: {
  schoolId: string;
  intentId: string;
  providerTransactionId: string;
}) {
  const schoolId = requireUuid(input.schoolId, "School");
  const intentId = requireUuid(input.intentId, "Payment intent");
  const transactionId = input.providerTransactionId.trim();
  if (!transactionId) throw new Error("Provider transaction ID is required.");

  const [intent] = await db
    .select()
    .from(paymentIntents)
    .where(and(eq(paymentIntents.id, intentId), eq(paymentIntents.schoolId, schoolId)))
    .limit(1);
  if (!intent) throw new Error("Payment intent not found.");
  if (intent.status === "succeeded") return { intent, transaction: null, alreadyVerified: true };

  const provider = getPaymentProvider(intent.provider);
  const [existingTransaction] = await db
    .select()
    .from(paymentTransactions)
    .where(
      and(
        eq(paymentTransactions.schoolId, schoolId),
        eq(paymentTransactions.provider, intent.provider),
        eq(paymentTransactions.providerTransactionId, transactionId),
      ),
    )
    .limit(1);
  if (existingTransaction) {
    return { intent, transaction: existingTransaction, alreadyVerified: true };
  }
  const verification = await provider.verifyTransaction({
    providerTransactionId: transactionId,
    expectedAmount: intent.amount,
    currency: intent.currency,
  });
  if (
    verification.amount !== intent.amount ||
    verification.currency.toUpperCase() !== intent.currency.toUpperCase()
  ) {
    throw new Error("Provider verification does not match the payment intent.");
  }

  const metadata = (intent.metadata ?? {}) as {
    allocations?: Allocation[];
    paymentMethod?: PaymentMethod;
  };
  let paymentId: string | null = null;
  if (verification.status === "confirmed") {
    if (!metadata.allocations?.length) throw new Error("Payment intent has no invoice allocations.");
    const payment = await recordPayment({
      schoolId,
      studentId: intent.studentId,
      amount: intent.amount,
      method: metadata.paymentMethod ?? "other",
      reference: transactionId,
      allocations: metadata.allocations,
      notes: `Payment intent ${intent.clientReference}`,
    });
    paymentId = payment.id;
  }

  const [transaction] = await db
    .insert(paymentTransactions)
    .values({
      schoolId,
      intentId,
      paymentId,
      provider: provider.name,
      providerTransactionId: transactionId,
      amount: verification.amount,
      currency: verification.currency,
      status: verification.status,
      rawResponse: verification.rawResponse,
      failureReason: verification.failureReason ?? null,
      verifiedAt: new Date(),
    })
    .returning();

  const [updatedIntent] = await db
    .update(paymentIntents)
    .set({
      status: verification.status === "confirmed" ? "succeeded" : "failed",
      updatedAt: new Date(),
    })
    .where(and(eq(paymentIntents.id, intentId), eq(paymentIntents.schoolId, schoolId)))
    .returning();
  return { intent: updatedIntent, transaction };
}

export async function getPaymentIntentStatus(schoolId: string, intentId: string) {
  const [intent] = await db
    .select()
    .from(paymentIntents)
    .where(and(eq(paymentIntents.id, requireUuid(intentId, "Payment intent")), eq(paymentIntents.schoolId, requireUuid(schoolId, "School"))))
    .limit(1);
  if (!intent) throw new Error("Payment intent not found.");
  const [transaction] = await db
    .select()
    .from(paymentTransactions)
    .where(and(eq(paymentTransactions.intentId, intent.id), eq(paymentTransactions.schoolId, schoolId)))
    .limit(1);
  return { intent, transaction };
}
