export const dynamic = "force-dynamic";

import {
  ArrowLeft,
  CheckCircle2,
  CircleAlert,
  CreditCard,
  FileText,
  Receipt,
  User,
  WalletCards,
} from "lucide-react";
import Link from "next/link";
import { and, asc, eq } from "drizzle-orm";

import { db } from "@/db";
import {
  paymentAllocations,
  payments,
  studentInvoices,
  students,
} from "@/db/schema";
import { requireCurrentSchool } from "@/lib/current-school";
import {
  getInvoiceFinancials,
  type PaymentMethod,
  type PaymentStatus,
} from "@/lib/finance/finance-utils";

import PrintReceiptButton from "./PrintReceiptButton";
import PaymentReceiptPrint from "./PaymentReceiptPrint";


type StudentRow = {
  id: string;
  studentNumber: string;
  firstName: string;
  lastName: string;
};


function formatMoney(value: string | number) {
  return new Intl.NumberFormat("en-GH", {
    style: "currency",
    currency: "GHS",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value));
}

function formatDate(value: string | Date | null) {
  if (!value) {
    return "â€”";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "â€”";
  }

  return new Intl.DateTimeFormat("en-GH", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatMethod(method: PaymentMethod) {
  return method
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) =>
      character.toUpperCase(),
    );
}

function getStudentName(student: StudentRow) {
  return `${student.firstName} ${student.lastName}`.trim();
}

function getStatusLabel(status: PaymentStatus) {
  if (status === "reversed") {
    return "Reversed";
  }

  return "Posted";
}

function getStatusClasses(status: PaymentStatus) {
  if (status === "reversed") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  return "border-emerald-200 bg-emerald-50 text-emerald-700";
}

export default async function PaymentReceiptPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const school = await requireCurrentSchool();

  const [paymentResult] = await db
    .select({
      payment: payments,
      student: students,
    })
    .from(payments)
    .innerJoin(
      students,
      eq(payments.studentId, students.id),
    )
    .where(
      and(
        eq(payments.id, id),
        eq(payments.schoolId, school.id),
        eq(students.schoolId, school.id),
      ),
    )
    .limit(1);

  if (!paymentResult) {
    return (
      <div className="mx-auto max-w-3xl py-12">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
          <CircleAlert className="mx-auto h-10 w-10 text-red-600" />

          <h1 className="mt-4 text-xl font-bold text-red-950">
            Payment not found
          </h1>

          <p className="mt-2 text-sm text-red-700">
            The payment may have been deleted, or it does not belong
            to the current school.
          </p>

          <Link
            href="/finance/payments"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to payments
          </Link>
        </div>
      </div>
    );
  }

  const payment = paymentResult.payment;
  const student = paymentResult.student;

  const allocationRows = await db
    .select({
      invoiceId: paymentAllocations.invoiceId,
      invoiceNumber: studentInvoices.invoiceNumber,
      amount: paymentAllocations.amount,
      issueDate: studentInvoices.issueDate,
      dueDate: studentInvoices.dueDate,
    })
    .from(paymentAllocations)
    .innerJoin(
      studentInvoices,
      eq(
        paymentAllocations.invoiceId,
        studentInvoices.id,
      ),
    )
    .where(
      and(
        eq(
          paymentAllocations.paymentId,
          payment.id,
        ),
        eq(
          studentInvoices.schoolId,
          school.id,
        ),
        eq(
          studentInvoices.studentId,
          student.id,
        ),
      ),
    )
    .orderBy(
      asc(studentInvoices.issueDate),
    );

  const invoiceFinancials = await Promise.all(
    allocationRows.map((allocation) =>
      getInvoiceFinancials(
        allocation.invoiceId,
        school.id,
      ),
    ),
  );

  const invoiceFinancialMap = new Map(
    invoiceFinancials.map((financials) => [
      financials.invoiceId,
      financials,
    ]),
  );

  const paymentAmount = Number(payment.amount);

  const allocatedAmount = allocationRows.reduce(
    (total, allocation) =>
      total + Number(allocation.amount),
    0,
  );

  const outstandingAfterPayment =
    invoiceFinancials.reduce(
      (total, financials) =>
        total + financials.balance,
      0,
    );

  const studentName = getStudentName(student);

  const isReversed = payment.status === "reversed";

  return (
    <>
      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 12mm;
          }

          html,
          body {
            background: white !important;
          }

          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          .no-print {
            display: none !important;
          }

          .receipt-shell {
            width: 100% !important;
            max-width: none !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          .receipt-paper {
            border: 0 !important;
            box-shadow: none !important;
            border-radius: 0 !important;
          }

          .print-break-inside-avoid {
            break-inside: avoid;
            page-break-inside: avoid;
          }
        }
      `}</style>

      <div className="receipt-shell mx-auto max-w-4xl space-y-5">
        {/* Page controls */}
        <div className="no-print flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <Link
            href="/finance/payments"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition-colors hover:text-slate-950"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to payments
          </Link>

          <PrintReceiptButton />
        </div>

        {/* Receipt */}
        <article className="receipt-paper overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {/* Header */}
          <header className="border-b border-slate-200 px-6 py-7 sm:px-10 sm:py-8">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-white">
                    <Receipt className="h-6 w-6" />
                  </div>

                  <div className="min-w-0">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                      Official school fees receipt
                    </p>

                    <h1 className="mt-1 truncate text-xl font-bold tracking-tight text-slate-950 sm:text-2xl">
                      {school.name}
                    </h1>

                    <p className="mt-1 text-sm text-slate-500">
                      Financial transaction record
                    </p>
                  </div>
                </div>
              </div>

              <div className="sm:text-right">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                  Receipt number
                </p>

                <p className="mt-1 text-lg font-bold text-slate-950">
                  {payment.receiptNumber}
                </p>

                <div
                  className={`mt-2 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${getStatusClasses(
                    payment.status,
                  )}`}
                >
                  {isReversed ? (
                    <CircleAlert className="h-3.5 w-3.5" />
                  ) : (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  )}

                  {getStatusLabel(payment.status)}
                </div>
              </div>
            </div>
          </header>

          {/* Student and payment information */}
          <section className="grid border-b border-slate-200 sm:grid-cols-2">
            <div className="border-b border-slate-200 px-6 py-6 sm:border-b-0 sm:border-r sm:px-10">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-slate-500" />

                <h2 className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                  Student
                </h2>
              </div>

              <div className="mt-4">
                <p className="text-lg font-bold text-slate-950">
                  {studentName}
                </p>

                <dl className="mt-3 space-y-2 text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="text-slate-500">
                      Student number
                    </dt>

                    <dd className="font-semibold text-slate-900">
                      {student.studentNumber}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>

            <div className="px-6 py-6 sm:px-10">
              <div className="flex items-center gap-2">
                <WalletCards className="h-4 w-4 text-slate-500" />

                <h2 className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                  Payment
                </h2>
              </div>

              <dl className="mt-4 space-y-2.5 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500">
                    Payment date
                  </dt>

                  <dd className="font-semibold text-slate-900">
                    {formatDate(payment.paymentDate)}
                  </dd>
                </div>

                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500">
                    Method
                  </dt>

                  <dd className="font-semibold text-slate-900">
                    {formatMethod(payment.method)}
                  </dd>
                </div>

                {payment.reference ? (
                  <div className="flex justify-between gap-4">
                    <dt className="text-slate-500">
                      Reference
                    </dt>

                    <dd className="max-w-[220px] truncate font-semibold text-slate-900">
                      {payment.reference}
                    </dd>
                  </div>
                ) : null}
              </dl>
            </div>
          </section>

          {/* Amount received */}
          <section className="border-b border-slate-200 bg-slate-50 px-6 py-7 sm:px-10">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                  Amount received
                </p>

                <p className="mt-1 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                  {formatMoney(paymentAmount)}
                </p>
              </div>

              <div className="flex items-center gap-2 text-sm text-slate-500">
                <CreditCard className="h-4 w-4" />
                {formatMethod(payment.method)}
              </div>
            </div>
          </section>

          {/* Invoice allocations */}
          <section className="px-6 py-7 sm:px-10">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-slate-500" />

              <h2 className="text-sm font-bold text-slate-950">
                Invoice allocation
              </h2>
            </div>

            <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[620px] text-sm">
                  <thead className="bg-slate-50 text-left">
                    <tr>
                      <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">
                        Invoice
                      </th>

                      <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">
                        Issue date
                      </th>

                      <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">
                        Due date
                      </th>

                      <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-slate-500">
                        Allocated
                      </th>

                      <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-slate-500">
                        Remaining
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100 bg-white">
                    {allocationRows.length ? (
                      allocationRows.map((allocation) => {
                        const financials =
                          invoiceFinancialMap.get(
                            allocation.invoiceId,
                          );

                        return (
                          <tr
                            key={allocation.invoiceId}
                            className="print-break-inside-avoid"
                          >
                            <td className="px-4 py-3">
                              <Link
                                href={`/finance/invoices/${allocation.invoiceId}`}
                                className="font-semibold text-blue-700 hover:text-blue-800 hover:underline"
                              >
                                {allocation.invoiceNumber}
                              </Link>
                            </td>

                            <td className="px-4 py-3 text-slate-600">
                              {formatDate(
                                allocation.issueDate,
                              )}
                            </td>

                            <td className="px-4 py-3 text-slate-600">
                              {formatDate(
                                allocation.dueDate,
                              )}
                            </td>

                            <td className="px-4 py-3 text-right font-semibold text-slate-950">
                              {formatMoney(
                                allocation.amount,
                              )}
                            </td>

                            <td className="px-4 py-3 text-right font-semibold text-slate-950">
                              {formatMoney(
                                financials?.balance ?? 0,
                              )}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-4 py-8 text-center text-sm text-slate-500"
                        >
                          No invoice allocations were found.
                        </td>
                      </tr>
                    )}
                  </tbody>

                  <tfoot className="border-t border-slate-200 bg-slate-50">
                    <tr>
                      <td
                        colSpan={3}
                        className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-slate-500"
                      >
                        Total allocated
                      </td>

                      <td className="px-4 py-3 text-right text-sm font-bold text-slate-950">
                        {formatMoney(allocatedAmount)}
                      </td>

                      <td className="px-4 py-3 text-right text-sm font-bold text-slate-950">
                        {formatMoney(
                          outstandingAfterPayment,
                        )}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </section>

          {/* Financial summary */}
          <section className="grid border-t border-slate-200 sm:grid-cols-3">
            <div className="border-b border-slate-200 px-6 py-5 sm:border-b-0 sm:border-r sm:px-10">
              <p className="text-xs font-semibold text-slate-500">
                Amount received
              </p>

              <p className="mt-1 text-base font-bold text-slate-950">
                {formatMoney(paymentAmount)}
              </p>
            </div>

            <div className="border-b border-slate-200 px-6 py-5 sm:border-b-0 sm:border-r sm:px-10">
              <p className="text-xs font-semibold text-slate-500">
                Allocated to invoices
              </p>

              <p className="mt-1 text-base font-bold text-slate-950">
                {formatMoney(allocatedAmount)}
              </p>
            </div>

            <div className="px-6 py-5 sm:px-10">
              <p className="text-xs font-semibold text-slate-500">
                Outstanding after payment
              </p>

              <p className="mt-1 text-base font-bold text-slate-950">
                {formatMoney(outstandingAfterPayment)}
              </p>
            </div>
          </section>

          {/* Notes */}
          {payment.notes ? (
            <section className="border-t border-slate-200 px-6 py-6 sm:px-10">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                Narration / notes
              </p>

              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                {payment.notes}
              </p>
            </section>
          ) : null}

          {/* Reversal warning */}
          {isReversed ? (
            <section className="border-t border-red-200 bg-red-50 px-6 py-5 sm:px-10">
              <div className="flex items-start gap-3">
                <CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />

                <div>
                  <p className="text-sm font-bold text-red-900">
                    Payment reversed
                  </p>

                  <p className="mt-1 text-sm leading-5 text-red-700">
                    This receipt records a payment that has been
                    reversed and should not be treated as a current
                    collection.
                  </p>
                </div>
              </div>
            </section>
          ) : null}

          {/* Footer */}
          <footer className="border-t border-slate-200 bg-slate-50 px-6 py-6 sm:px-10">
            <div className="flex flex-col justify-between gap-3 text-xs text-slate-500 sm:flex-row sm:items-end">
              <div>
                <p className="font-semibold text-slate-700">
                  Official payment record
                </p>

                <p className="mt-1">
                  Receipt generated from the school&apos;s finance
                  records.
                </p>
              </div>

              <div className="sm:text-right">
                <p>
                  Receipt:{" "}
                  <span className="font-semibold text-slate-700">
                    {payment.receiptNumber}
                  </span>
                </p>

                <p className="mt-1">
                  Printed on{" "}
                  {new Intl.DateTimeFormat("en-GH", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  }).format(new Date())}
                </p>
              </div>
            </div>
          </footer>
        </article>
      </div>
    </>
  );
}
