import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  CalendarClock,
  CircleDollarSign,
  FileWarning,
} from "lucide-react";
import { and, asc, eq } from "drizzle-orm";

import { db } from "@/db";
import {
  studentInvoices,
  students,
} from "@/db/schema";
import { getCurrentSchool } from "@/lib/current-school";
import { getInvoiceFinancials } from "@/lib/finance/finance-utils";

function formatMoney(value: string | number | null) {
  return new Intl.NumberFormat("en-GH", {
    style: "currency",
    currency: "GHS",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

function formatDate(value: string | Date | null) {
  if (!value) return "—";

  const date =
    value instanceof Date
      ? value
      : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-GH", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export default async function OutstandingReportPage() {
  const school = await getCurrentSchool();

  /*
   * Capture the current time once.
   *
   * This keeps the server component render pure and
   * gives every invoice in this report the same
   * reference point.
   */
  const now = new Date();

  const invoices = await db
    .select({
      id: studentInvoices.id,
      invoiceNumber: studentInvoices.invoiceNumber,
      studentId: studentInvoices.studentId,
      studentNumber: students.studentNumber,
      firstName: students.firstName,
      lastName: students.lastName,
      issueDate: studentInvoices.issueDate,
      dueDate: studentInvoices.dueDate,
      status: studentInvoices.status,
    })
    .from(studentInvoices)
    .innerJoin(
      students,
      eq(
        students.id,
        studentInvoices.studentId,
      ),
    )
    .where(
      and(
        eq(studentInvoices.schoolId, school.id),
      ),
    )
    .orderBy(
      asc(studentInvoices.dueDate),
    )
    .limit(1000);

  const financialRows = await Promise.all(
    invoices.map(async (invoice) => {
      const financials =
        await getInvoiceFinancials(
          invoice.id,
          school.id,
        );

      return {
        ...invoice,
        ...financials,
      };
    }),
  );

  const outstanding = financialRows.filter(
    (invoice) =>
      invoice.status !== "cancelled" &&
      invoice.status !== "draft" &&
      invoice.balance > 0.005,
  );

  const totalOutstanding = outstanding.reduce(
    (sum, invoice) =>
      sum + Number(invoice.balance),
    0,
  );

  const overdueInvoices = outstanding.filter(
    (invoice) => {
      if (!invoice.dueDate) {
        return false;
      }

      return (
        new Date(invoice.dueDate).getTime() <
        now.getTime()
      );
    },
  );

  const totalOverdue = overdueInvoices.reduce(
    (sum, invoice) =>
      sum + Number(invoice.balance),
    0,
  );

  return (
    <main className="space-y-8 p-6 lg:p-8">
      <section>
        <Link
          href="/finance/reports"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to reports
        </Link>

        <div className="mt-5">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <FileWarning className="h-4 w-4" />
            Finance
            <span>/</span>
            Reports
            <span>/</span>
            Outstanding
          </div>

          <h1 className="mt-4 text-3xl font-semibold tracking-tight">
            Outstanding balances
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            Review invoices with unpaid balances and
            identify overdue amounts.
          </p>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <MetricCard
          icon={CircleDollarSign}
          label="Total outstanding"
          value={formatMoney(totalOutstanding)}
        />

        <MetricCard
          icon={AlertCircle}
          label="Overdue amount"
          value={formatMoney(totalOverdue)}
        />

        <MetricCard
          icon={CalendarClock}
          label="Invoices outstanding"
          value={outstanding.length.toLocaleString()}
        />
      </section>

      <section className="overflow-hidden rounded-xl border bg-card shadow-sm">
        <div className="border-b px-5 py-4">
          <h2 className="font-semibold">
            Outstanding invoice register
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Balances are calculated from invoice items,
            adjustments and posted payment allocations.
          </p>
        </div>

        {outstanding.length === 0 ? (
          <div className="p-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10">
              <CircleDollarSign className="h-6 w-6 text-emerald-600" />
            </div>

            <h3 className="mt-4 font-semibold">
              No outstanding balances
            </h3>

            <p className="mt-1 text-sm text-muted-foreground">
              There are currently no invoices with an
              unpaid balance.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-left">
                <tr>
                  <th className="px-5 py-3 font-medium">
                    Invoice
                  </th>

                  <th className="px-5 py-3 font-medium">
                    Student
                  </th>

                  <th className="px-5 py-3 font-medium">
                    Issue date
                  </th>

                  <th className="px-5 py-3 font-medium">
                    Due date
                  </th>

                  <th className="px-5 py-3 text-right font-medium">
                    Total
                  </th>

                  <th className="px-5 py-3 text-right font-medium">
                    Paid
                  </th>

                  <th className="px-5 py-3 text-right font-medium">
                    Balance
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y">
                {outstanding.map((invoice) => {
                  const overdue =
                    invoice.dueDate
                      ? new Date(
                          invoice.dueDate,
                        ).getTime() <
                        now.getTime()
                      : false;

                  return (
                    <tr
                      key={invoice.id}
                      className="transition hover:bg-muted/20"
                    >
                      <td className="px-5 py-4">
                        <Link
                          href={`/finance/invoices/${invoice.id}`}
                          className="font-medium text-primary hover:underline"
                        >
                          {invoice.invoiceNumber}
                        </Link>

                        {overdue && (
                          <span className="mt-1 block text-xs font-medium text-red-600">
                            Overdue
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <div>
                          <p className="font-medium">
                            {`${invoice.firstName} ${invoice.lastName}`.trim()}
                          </p>

                          <p className="text-xs text-muted-foreground">
                            {invoice.studentNumber}
                          </p>
                        </div>
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-muted-foreground">
                        {formatDate(
                          invoice.issueDate,
                        )}
                      </td>

                      <td
                        className={[
                          "whitespace-nowrap px-5 py-4",
                          overdue
                            ? "font-medium text-red-600"
                            : "text-muted-foreground",
                        ].join(" ")}
                      >
                        {formatDate(
                          invoice.dueDate,
                        )}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-right">
                        {formatMoney(
                          invoice.total,
                        )}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-right">
                        {formatMoney(
                          invoice.paid,
                        )}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-right font-semibold">
                        {formatMoney(
                          invoice.balance,
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>

              <tfoot>
                <tr className="border-t bg-muted/20">
                  <td
                    colSpan={6}
                    className="px-5 py-4 text-right font-semibold"
                  >
                    Total outstanding
                  </td>

                  <td className="px-5 py-4 text-right text-lg font-semibold">
                    {formatMoney(
                      totalOutstanding,
                    )}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof CircleDollarSign;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <div className="w-fit rounded-lg bg-muted p-2.5">
        <Icon className="h-5 w-5" />
      </div>

      <p className="mt-4 text-sm text-muted-foreground">
        {label}
      </p>

      <p className="mt-2 text-2xl font-semibold tracking-tight">
        {value}
      </p>
    </div>
  );
}