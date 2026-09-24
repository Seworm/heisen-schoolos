import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { cashbookEntries, invoiceAdjustments, paymentAllocations, payments, schoolSettings, studentInvoiceItems, studentInvoices } from "@/db/schema";
import { paymentInputSchema } from "@/lib/validation";

export async function getStudentBalance(schoolId: string, studentId: string) {
  const invoices = await db.select({ id: studentInvoices.id, amount: sql<string>`coalesce(sum(${studentInvoiceItems.amount}),0)` })
    .from(studentInvoices)
    .leftJoin(studentInvoiceItems, eq(studentInvoiceItems.invoiceId, studentInvoices.id))
    .where(and(eq(studentInvoices.schoolId, schoolId), eq(studentInvoices.studentId, studentId), sql`${studentInvoices.status} <> 'cancelled'`))
    .groupBy(studentInvoices.id);
  if (!invoices.length) return { invoiced: 0, paid: 0, adjustments: 0, balance: 0 };
  const invoiceIds = invoices.map((invoice) => invoice.id);
  const [paidRow, adjustmentRow] = await Promise.all([
    db.select({ total: sql<string>`coalesce(sum(${paymentAllocations.amount}),0)` }).from(paymentAllocations).innerJoin(studentInvoices, eq(studentInvoices.id, paymentAllocations.invoiceId)).where(and(eq(studentInvoices.schoolId, schoolId), inArray(paymentAllocations.invoiceId, invoiceIds))),
    db.select({ total: sql<string>`coalesce(sum(case when ${invoiceAdjustments.type} in ('discount','waiver') then ${invoiceAdjustments.amount} else -${invoiceAdjustments.amount} end),0)` }).from(invoiceAdjustments).innerJoin(studentInvoices, eq(studentInvoices.id, invoiceAdjustments.invoiceId)).where(and(eq(studentInvoices.schoolId, schoolId), inArray(invoiceAdjustments.invoiceId, invoiceIds), eq(invoiceAdjustments.status, "active"))),
  ]);
  const invoiced = invoices.reduce((sum, invoice) => sum + Number(invoice.amount), 0);
  const paid = Number(paidRow[0]?.total ?? 0);
  const adjustments = Number(adjustmentRow[0]?.total ?? 0);
  return { invoiced, paid, adjustments, balance: Math.max(0, invoiced - adjustments - paid) };
}

export async function recordPayment(input: unknown, schoolId: string, actorId: string) {
  const data = paymentInputSchema.parse(input);
  return db.transaction(async (tx) => {
    const balance = await getStudentBalance(schoolId, data.studentId);
    const [settings] = await tx.select({ allowOverpayment: schoolSettings.allowOverpayment }).from(schoolSettings).where(eq(schoolSettings.schoolId, schoolId)).limit(1);
    if (!settings?.allowOverpayment && data.amount > balance.balance + 0.005) throw new Error(`Payment exceeds the outstanding balance of GHS ${balance.balance.toFixed(2)}.`);
    const [payment] = await tx.insert(payments).values({ schoolId, studentId: data.studentId, receiptNumber: `RC-${Date.now()}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`, paymentDate: data.paymentDate, amount: data.amount.toFixed(2), method: data.method, reference: data.reference || null, notes: data.notes || null }).returning();
    if (!payment) throw new Error("Failed to record payment.");
    await tx.insert(cashbookEntries).values({
      schoolId,
      entryDate: payment.paymentDate,
      entryType: "income",
      category: "Student payments",
      description: `Student payment ${payment.receiptNumber}`,
      amount: payment.amount,
      method: payment.method,
      reference: payment.reference,
      sourcePaymentId: payment.id,
      createdBy: actorId,
    });
    let remaining = data.amount;
    const invoices = await tx.select({ id: studentInvoices.id, total: sql<string>`coalesce(sum(${studentInvoiceItems.amount}),0)` }).from(studentInvoices).leftJoin(studentInvoiceItems, eq(studentInvoiceItems.invoiceId, studentInvoices.id)).where(and(eq(studentInvoices.schoolId, schoolId), eq(studentInvoices.studentId, data.studentId), sql`${studentInvoices.status} in ('issued','partially_paid','overdue')`)).groupBy(studentInvoices.id).orderBy(studentInvoices.issueDate);
    for (const invoice of invoices) {
      if (remaining <= 0) break;
      const paidRow = await tx.select({ total: sql<string>`coalesce(sum(${paymentAllocations.amount}),0)` }).from(paymentAllocations).where(eq(paymentAllocations.invoiceId, invoice.id));
      const outstanding = Math.max(0, Number(invoice.total) - Number(paidRow[0]?.total ?? 0));
      const allocation = Math.min(remaining, outstanding);
      if (allocation <= 0) continue;
      await tx.insert(paymentAllocations).values({ paymentId: payment.id, invoiceId: invoice.id, amount: allocation.toFixed(2) });
      remaining -= allocation;
    }
    void actorId;
    return payment;
  });
}
