import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  CircleDollarSign,
  FileText,
  Receipt,
} from "lucide-react";

import { and, asc, desc, eq } from "drizzle-orm";

import { db } from "@/db";
import {
  payments,
  studentInvoices,
  students,
} from "@/db/schema";

import { getCurrentSchool } from "@/lib/current-school";
import {
  getInvoiceFinancials,
} from "@/lib/finance/finance-utils";

function formatMoney(
  value: string | number | null,
) {
  return new Intl.NumberFormat(
    "en-GH",
    {
      style: "currency",
      currency: "GHS",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    },
  ).format(Number(value || 0));
}

function formatDate(
  value: string | Date | null,
) {
  if (!value) return "—";

  const date =
    value instanceof Date
      ? value
      : new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    "en-GH",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    },
  ).format(date);
}

function statusClass(
  status: string,
) {
  switch (status) {
    case "paid":
      return "bg-emerald-500/10 text-emerald-700";

    case "overdue":
      return "bg-destructive/10 text-destructive";

    case "partially_paid":
      return "bg-amber-500/10 text-amber-700";

    case "cancelled":
      return "bg-muted text-muted-foreground";

    default:
      return "bg-blue-500/10 text-blue-700";
  }
}

export default async function StudentFinancialStatementPage({
  params,
}: {
  params: Promise<{
    id: string;
  }>;
}) {
  const { id } = await params;

  const school =
    await getCurrentSchool();

  const [student] =
    await db
      .select({
        id: students.id,
        studentNumber:
          students.studentNumber,
        firstName:
          students.firstName,
        lastName:
          students.lastName,
      })
      .from(students)
      .where(
        and(
          eq(
            students.id,
            id,
          ),
          eq(
            students.schoolId,
            school.id,
          ),
        ),
      )
      .limit(1);

  if (!student) {
    return (
      <div className="space-y-4">
        <Link
          href="/finance"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to finance
        </Link>

        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-8 text-center">
          <h1 className="font-semibold">
            Student not found
          </h1>

          <p className="mt-1 text-sm text-muted-foreground">
            The requested student could
            not be found in this school.
          </p>
        </div>
      </div>
    );
  }

  const invoices =
    await db
      .select({
        id: studentInvoices.id,
        invoiceNumber:
          studentInvoices.invoiceNumber,
        issueDate:
          studentInvoices.issueDate,
        dueDate:
          studentInvoices.dueDate,
        status:
          studentInvoices.status,
      })
      .from(studentInvoices)
      .where(
        and(
          eq(
            studentInvoices.studentId,
            student.id,
          ),
          eq(
            studentInvoices.schoolId,
            school.id,
          ),
        ),
      )
      .orderBy(
        asc(studentInvoices.issueDate),
      );

  const financialInvoices =
    await Promise.all(
      invoices.map(
        async (invoice) => {
          const financials =
            await getInvoiceFinancials(
              invoice.id,
              school.id,
            );

          return {
            ...invoice,
            ...financials,
          };
        },
      ),
    );

  const activeInvoices =
    financialInvoices.filter(
      (invoice) =>
        invoice.status !==
          "cancelled" &&
        invoice.status !==
          "draft",
    );

  const totalInvoiced =
    activeInvoices.reduce(
      (sum, invoice) =>
        sum +
        Number(
          invoice.total,
        ),
      0,
    );

  const totalPaid =
    activeInvoices.reduce(
      (sum, invoice) =>
        sum +
        Number(
          invoice.paid,
        ),
      0,
    );

  const totalOutstanding =
    activeInvoices.reduce(
      (sum, invoice) =>
        sum +
        Number(
          invoice.balance,
        ),
      0,
    );

  const now = new Date();

  const overdueInvoices =
    activeInvoices.filter(
      (invoice) =>
        invoice.balance >
          0.005 &&
        invoice.dueDate &&
        new Date(
          invoice.dueDate,
        ).getTime() <
          now.getTime(),
    );

  const totalOverdue =
    overdueInvoices.reduce(
      (sum, invoice) =>
        sum +
        Number(
          invoice.balance,
        ),
      0,
    );

  const paymentRows =
    await db
      .select({
        id: payments.id,
        receiptNumber:
          payments.receiptNumber,
        paymentDate:
          payments.paymentDate,
        amount:
          payments.amount,
        method:
          payments.method,
        reference:
          payments.reference,
        status:
          payments.status,
      })
      .from(payments)
      .where(
        and(
          eq(
            payments.studentId,
            student.id,
          ),
          eq(
            payments.schoolId,
            school.id,
          ),
        ),
      )
      .orderBy(
        desc(
          payments.paymentDate,
        ),
        desc(
          payments.createdAt,
        ),
      )
      .limit(100);

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/finance"
          className="mb-3 inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to finance
        </Link>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">
              Student financial statement
            </p>

            <h1 className="mt-1 text-2xl font-semibold tracking-tight">
              {student.firstName}{" "}
              {student.lastName}
            </h1>

            <p className="mt-1 text-sm text-muted-foreground">
              {student.studentNumber}
            </p>
          </div>

          <Link
            href={`/students/${student.id}`}
            className="inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition hover:bg-muted"
          >
            <FileText className="h-4 w-4" />
            Student profile
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Total invoiced
            </p>

            <FileText className="h-5 w-5 text-muted-foreground" />
          </div>

          <p className="mt-3 text-2xl font-semibold">
            {formatMoney(
              totalInvoiced,
            )}
          </p>
        </div>

        <div className="rounded-2xl border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Total paid
            </p>

            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          </div>

          <p className="mt-3 text-2xl font-semibold text-emerald-700">
            {formatMoney(
              totalPaid,
            )}
          </p>
        </div>

        <div className="rounded-2xl border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Outstanding
            </p>

            <CircleDollarSign className="h-5 w-5 text-amber-600" />
          </div>

          <p className="mt-3 text-2xl font-semibold">
            {formatMoney(
              totalOutstanding,
            )}
          </p>
        </div>

        <div className="rounded-2xl border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Overdue
            </p>

            <AlertCircle className="h-5 w-5 text-destructive" />
          </div>

          <p className="mt-3 text-2xl font-semibold text-destructive">
            {formatMoney(
              totalOverdue,
            )}
          </p>
        </div>
      </div>

      <section className="rounded-2xl border bg-card shadow-sm">
        <div className="border-b p-6">
          <h2 className="font-semibold">
            Invoices
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Complete invoice and balance
            history for this student.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30 text-left">
                <th className="px-6 py-3 font-medium">
                  Invoice
                </th>
                <th className="px-6 py-3 font-medium">
                  Issue date
                </th>
                <th className="px-6 py-3 font-medium">
                  Due date
                </th>
                <th className="px-6 py-3 text-right font-medium">
                  Total
                </th>
                <th className="px-6 py-3 text-right font-medium">
                  Paid
                </th>
                <th className="px-6 py-3 text-right font-medium">
                  Balance
                </th>
                <th className="px-6 py-3 font-medium">
                  Status
                </th>
              </tr>
            </thead>

            <tbody>
              {financialInvoices.map(
                (invoice) => (
                  <tr
                    key={invoice.id}
                    className="border-b last:border-0"
                  >
                    <td className="px-6 py-4">
                      <Link
                        href={`/finance/invoices/${invoice.id}`}
                        className="font-medium hover:underline"
                      >
                        {
                          invoice.invoiceNumber
                        }
                      </Link>
                    </td>

                    <td className="px-6 py-4 text-muted-foreground">
                      {formatDate(
                        invoice.issueDate,
                      )}
                    </td>

                    <td className="px-6 py-4 text-muted-foreground">
                      {formatDate(
                        invoice.dueDate,
                      )}
                    </td>

                    <td className="px-6 py-4 text-right font-medium">
                      {formatMoney(
                        invoice.total,
                      )}
                    </td>

                    <td className="px-6 py-4 text-right">
                      {formatMoney(
                        invoice.paid,
                      )}
                    </td>

                    <td className="px-6 py-4 text-right font-semibold">
                      {formatMoney(
                        invoice.balance,
                      )}
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusClass(
                          invoice.status,
                        )}`}
                      >
                        {invoice.status.replace(
                          "_",
                          " ",
                        )}
                      </span>
                    </td>
                  </tr>
                ),
              )}

              {!financialInvoices.length ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-10 text-center text-muted-foreground"
                  >
                    No invoices found.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl border bg-card shadow-sm">
        <div className="border-b p-6">
          <div className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-muted-foreground" />

            <h2 className="font-semibold">
              Payment history
            </h2>
          </div>

          <p className="mt-1 text-sm text-muted-foreground">
            Posted and reversed payments
            recorded for this student.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30 text-left">
                <th className="px-6 py-3 font-medium">
                  Receipt
                </th>
                <th className="px-6 py-3 font-medium">
                  Date
                </th>
                <th className="px-6 py-3 font-medium">
                  Method
                </th>
                <th className="px-6 py-3 font-medium">
                  Reference
                </th>
                <th className="px-6 py-3 text-right font-medium">
                  Amount
                </th>
                <th className="px-6 py-3 font-medium">
                  Status
                </th>
              </tr>
            </thead>

            <tbody>
              {paymentRows.map(
                (payment) => (
                  <tr
                    key={payment.id}
                    className="border-b last:border-0"
                  >
                    <td className="px-6 py-4">
                      <Link
                        href={`/finance/payments/${payment.id}`}
                        className="font-medium hover:underline"
                      >
                        {
                          payment.receiptNumber
                        }
                      </Link>
                    </td>

                    <td className="px-6 py-4 text-muted-foreground">
                      {formatDate(
                        payment.paymentDate,
                      )}
                    </td>

                    <td className="px-6 py-4 capitalize">
                      {payment.method.replace(
                        "_",
                        " ",
                      )}
                    </td>

                    <td className="px-6 py-4 text-muted-foreground">
                      {payment.reference ||
                        "—"}
                    </td>

                    <td className="px-6 py-4 text-right font-medium">
                      {formatMoney(
                        payment.amount,
                      )}
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                          payment.status ===
                          "posted"
                            ? "bg-emerald-500/10 text-emerald-700"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {
                          payment.status
                        }
                      </span>
                    </td>
                  </tr>
                ),
              )}

              {!paymentRows.length ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-10 text-center text-muted-foreground"
                  >
                    No payments recorded.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <CalendarClock className="h-4 w-4" />
        {overdueInvoices.length} overdue{" "}
        {overdueInvoices.length === 1
          ? "invoice"
          : "invoices"}
      </div>
    </div>
  );
}