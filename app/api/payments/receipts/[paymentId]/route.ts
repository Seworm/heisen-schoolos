import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  paymentAllocations,
  payments,
  studentInvoices,
  students,
} from "@/db/schema";
import { getCurrentSchool } from "@/lib/current-school";

export async function GET(
  _request: Request,
  context: { params: Promise<{ paymentId: string }> },
) {
  try {
    const school = await getCurrentSchool();
    const { paymentId } = await context.params;
    const [payment] = await db
      .select({
        id: payments.id,
        receiptNumber: payments.receiptNumber,
        paymentDate: payments.paymentDate,
        amount: payments.amount,
        method: payments.method,
        reference: payments.reference,
        status: payments.status,
        studentId: payments.studentId,
        studentName: students.firstName,
        studentLastName: students.lastName,
      })
      .from(payments)
      .innerJoin(students, eq(students.id, payments.studentId))
      .where(and(eq(payments.id, paymentId), eq(payments.schoolId, school.id)))
      .limit(1);
    if (!payment) return NextResponse.json({ error: "Receipt not found." }, { status: 404 });

    const allocations = await db
      .select({
        invoiceId: paymentAllocations.invoiceId,
        amount: paymentAllocations.amount,
        invoiceNumber: studentInvoices.invoiceNumber,
      })
      .from(paymentAllocations)
      .innerJoin(studentInvoices, eq(studentInvoices.id, paymentAllocations.invoiceId))
      .where(eq(paymentAllocations.paymentId, payment.id));
    return NextResponse.json({ receipt: { ...payment, allocations } });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to load receipt." },
      { status: 404 },
    );
  }
}
