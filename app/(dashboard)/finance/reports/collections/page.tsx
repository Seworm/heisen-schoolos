import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  CircleDollarSign,
  HandCoins,
  ReceiptText,
} from "lucide-react";
import { desc, eq, sql } from "drizzle-orm";

import { db } from "@/db";
import {
  payments,
  students,
} from "@/db/schema";
import { getCurrentSchool } from "@/lib/current-school";

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

  const date = value instanceof Date
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

function formatMethod(method: string) {
  return method
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export default async function CollectionsReportPage() {
  const school = await getCurrentSchool();

  const [summary] = await db
    .select({
      count: sql<number>`
        count(*) filter (
          where ${payments.status} = 'posted'
        )
      `,
      total: sql<string>`
        coalesce(
          sum(
            case
              when ${payments.status} = 'posted'
              then ${payments.amount}
              else 0
            end
          ),
          0
        )
      `,
      reversed: sql<string>`
        coalesce(
          sum(
            case
              when ${payments.status} = 'reversed'
              then ${payments.amount}
              else 0
            end
          ),
          0
        )
      `,
    })
    .from(payments)
    .where(
      eq(payments.schoolId, school.id),
    );

  const collections = await db
    .select({
      id: payments.id,
      receiptNumber: payments.receiptNumber,
      studentId: payments.studentId,
      studentNumber: students.studentNumber,
      firstName: students.firstName,
      lastName: students.lastName,
      paymentDate: payments.paymentDate,
      amount: payments.amount,
      method: payments.method,
      reference: payments.reference,
      status: payments.status,
    })
    .from(payments)
    .innerJoin(
      students,
      eq(students.id, payments.studentId),
    )
    .where(
      eq(payments.schoolId, school.id),
    )
    .orderBy(
      desc(payments.paymentDate),
      desc(payments.createdAt),
    )
    .limit(500);

  const postedCount = Number(summary?.count || 0);
  const totalCollected = Number(summary?.total || 0);
  const totalReversed = Number(summary?.reversed || 0);

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

        <div className="mt-5 flex flex-col gap-4">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <HandCoins className="h-4 w-4" />
            Finance
            <span>/</span>
            Reports
            <span>/</span>
            Collections
          </div>

          <div>
            <h1 className="text-3xl font-semibold tracking-tight">
              Collections report
            </h1>

            <p className="mt-2 text-sm text-muted-foreground">
              Review payments received across the school.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <MetricCard
          icon={ReceiptText}
          label="Posted payments"
          value={postedCount.toLocaleString()}
        />

        <MetricCard
          icon={CircleDollarSign}
          label="Total collected"
          value={formatMoney(totalCollected)}
        />

        <MetricCard
          icon={CalendarDays}
          label="Reversed payments"
          value={formatMoney(totalReversed)}
        />
      </section>

      <section className="overflow-hidden rounded-xl border bg-card shadow-sm">
        <div className="border-b px-5 py-4">
          <h2 className="font-semibold">
            Collection register
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Latest 500 payment records.
          </p>
        </div>

        {collections.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            No payment records found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-left">
                <tr>
                  <th className="px-5 py-3 font-medium">
                    Receipt
                  </th>

                  <th className="px-5 py-3 font-medium">
                    Student
                  </th>

                  <th className="px-5 py-3 font-medium">
                    Date
                  </th>

                  <th className="px-5 py-3 font-medium">
                    Method
                  </th>

                  <th className="px-5 py-3 text-right font-medium">
                    Amount
                  </th>

                  <th className="px-5 py-3 font-medium">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y">
                {collections.map((payment) => (
                  <tr
                    key={payment.id}
                    className="transition hover:bg-muted/20"
                  >
                    <td className="px-5 py-4">
                      <Link
                        href={`/finance/payments/${payment.id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {payment.receiptNumber}
                      </Link>
                    </td>

                    <td className="px-5 py-4">
                      <div>
                        <p className="font-medium">
                          {`${payment.firstName} ${payment.lastName}`.trim()}
                        </p>

                        <p className="text-xs text-muted-foreground">
                          {payment.studentNumber}
                        </p>
                      </div>
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 text-muted-foreground">
                      {formatDate(payment.paymentDate)}
                    </td>

                    <td className="px-5 py-4">
                      {formatMethod(payment.method)}
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 text-right font-semibold">
                      {formatMoney(payment.amount)}
                    </td>

                    <td className="px-5 py-4">
                      <StatusBadge status={payment.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
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
  icon: typeof ReceiptText;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <div className="rounded-lg bg-muted p-2.5 w-fit">
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

function StatusBadge({
  status,
}: {
  status: string;
}) {
  const styles: Record<string, string> = {
    posted:
      "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
    reversed:
      "bg-red-500/10 text-red-700 dark:text-red-400",
  };

  return (
    <span
      className={[
        "inline-flex rounded-full px-2.5 py-1 text-xs font-medium capitalize",
        styles[status] || "bg-muted text-muted-foreground",
      ].join(" ")}
    >
      {status}
    </span>
  );
}