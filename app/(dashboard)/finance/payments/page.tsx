import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { ArrowRight, CreditCard, Plus } from "lucide-react";

import { db } from "@/db";
import { payments, students } from "@/db/schema";
import { requireCurrentSchool } from "@/lib/current-school";

function formatMoney(value: string | number) {
  return new Intl.NumberFormat("en-GH", {
    style: "currency",
    currency: "GHS",
    minimumFractionDigits: 2,
  }).format(Number(value));
}

function formatDate(value: string | Date) {
  return new Intl.DateTimeFormat("en-GH", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export default async function PaymentsPage() {
  const school = await requireCurrentSchool();
  const paymentRows = await db
    .select({
      id: payments.id,
      receiptNumber: payments.receiptNumber,
      paymentDate: payments.paymentDate,
      amount: payments.amount,
      method: payments.method,
      status: payments.status,
      studentFirstName: students.firstName,
      studentLastName: students.lastName,
      studentNumber: students.studentNumber,
    })
    .from(payments)
    .innerJoin(students, eq(students.id, payments.studentId))
    .where(eq(payments.schoolId, school.id))
    .orderBy(desc(payments.paymentDate), desc(payments.createdAt));

  return (
    <main className="space-y-8 p-6 lg:p-8">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
            <CreditCard className="h-4 w-4" />
            Finance <span>/</span> Payments
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">Payments</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Review posted student payments and receipts for {school.name}.
          </p>
        </div>
        <Link
          href="/finance/payments/new"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground"
        >
          <Plus className="h-4 w-4" />
          Record payment
        </Link>
      </section>

      <section className="overflow-hidden rounded-xl border bg-card">
        {paymentRows.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <CreditCard className="mx-auto h-10 w-10 text-muted-foreground" />
            <h2 className="mt-4 font-semibold">No payments recorded</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Record a student payment to see it listed here.
            </p>
            <Link
              href="/finance/payments/new"
              className="mt-5 inline-flex rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground"
            >
              Record payment
            </Link>
          </div>
        ) : (
          <div className="divide-y">
            {paymentRows.map((payment) => (
              <Link
                key={payment.id}
                href={`/finance/payments/${payment.id}`}
                className="flex flex-col gap-3 px-5 py-4 transition hover:bg-muted/40 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium">
                    {payment.studentFirstName} {payment.studentLastName}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {payment.studentNumber} · Receipt {payment.receiptNumber} ·{" "}
                    {formatDate(payment.paymentDate)}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-semibold">{formatMoney(payment.amount)}</p>
                    <p className="text-xs capitalize text-muted-foreground">
                      {payment.method.replaceAll("_", " ")} · {payment.status}
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
