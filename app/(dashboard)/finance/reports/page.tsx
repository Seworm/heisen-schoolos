import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  CircleDollarSign,
  FileText,
  HandCoins,
  ReceiptText,
  WalletCards,
} from "lucide-react";
import { eq, sql } from "drizzle-orm";

import { db } from "@/db";
import {
  payments,
  studentInvoices,
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

export default async function FinanceReportsPage() {
  const school = await getCurrentSchool();

  const [
    invoiceSummary,
    paymentSummary,
    invoiceStatusSummary,
  ] = await Promise.all([
    db
      .select({
        count: sql<number>`count(*)`,
      })
      .from(studentInvoices)
      .where(
        eq(studentInvoices.schoolId, school.id),
      ),

    db
      .select({
        count: sql<number>`count(*)`,
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
      })
      .from(payments)
      .where(
        eq(payments.schoolId, school.id),
      ),

    db
      .select({
        status: studentInvoices.status,
        count: sql<number>`count(*)`,
      })
      .from(studentInvoices)
      .where(
        eq(studentInvoices.schoolId, school.id),
      )
      .groupBy(studentInvoices.status),
  ]);

  const totalInvoices = Number(
    invoiceSummary[0]?.count || 0,
  );

  const postedPayments = Number(
    paymentSummary[0]?.count || 0,
  );

  const totalCollected = Number(
    paymentSummary[0]?.total || 0,
  );

  const statusCounts = Object.fromEntries(
    invoiceStatusSummary.map((row) => [
      row.status,
      Number(row.count),
    ]),
  );

  const issued = statusCounts.issued || 0;
  const partiallyPaid =
    statusCounts.partially_paid || 0;
  const paid = statusCounts.paid || 0;
  const overdue = statusCounts.overdue || 0;
  const draft = statusCounts.draft || 0;
  const cancelled = statusCounts.cancelled || 0;

  return (
    <main className="space-y-8 p-6 lg:p-8">
      <section>
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <BarChart3 className="h-4 w-4" />
          Finance
          <span>/</span>
          Reports
        </div>

        <div className="mt-4">
          <h1 className="text-3xl font-semibold tracking-tight">
            Finance reports
          </h1>

          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Review collections, outstanding balances,
            invoice activity and payment performance.
          </p>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={FileText}
          label="Total invoices"
          value={totalInvoices.toLocaleString()}
        />

        <MetricCard
          icon={HandCoins}
          label="Posted payments"
          value={postedPayments.toLocaleString()}
        />

        <MetricCard
          icon={CircleDollarSign}
          label="Total collected"
          value={formatMoney(totalCollected)}
        />

        <MetricCard
          icon={WalletCards}
          label="Paid invoices"
          value={paid.toLocaleString()}
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <ReportCard
          href="/finance/reports/collections"
          icon={ReceiptText}
          title="Collections report"
          description="Review payments received, payment methods, receipts and collection activity."
        />

        <ReportCard
          href="/finance/reports/outstanding"
          icon={WalletCards}
          title="Outstanding balances"
          description="See invoices with unpaid balances and identify students with amounts due."
        />
      </section>

      <section className="overflow-hidden rounded-xl border bg-card shadow-sm">
        <div className="border-b px-5 py-4">
          <h2 className="font-semibold">
            Invoice status overview
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Current status distribution across all invoices.
          </p>
        </div>

        <div className="grid divide-y sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-3">
          <StatusMetric
            label="Draft"
            value={draft}
          />

          <StatusMetric
            label="Issued"
            value={issued}
          />

          <StatusMetric
            label="Partially paid"
            value={partiallyPaid}
          />

          <StatusMetric
            label="Paid"
            value={paid}
          />

          <StatusMetric
            label="Overdue"
            value={overdue}
          />

          <StatusMetric
            label="Cancelled"
            value={cancelled}
          />
        </div>
      </section>
    </main>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof FileText;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="rounded-lg bg-muted p-2.5">
          <Icon className="h-5 w-5" />
        </div>
      </div>

      <p className="mt-5 text-sm text-muted-foreground">
        {label}
      </p>

      <p className="mt-2 text-2xl font-semibold tracking-tight">
        {value}
      </p>
    </div>
  );
}

function ReportCard({
  href,
  icon: Icon,
  title,
  description,
}: {
  href: string;
  icon: typeof ReceiptText;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-xl border bg-card p-6 shadow-sm transition hover:border-primary/30 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="rounded-lg bg-muted p-3">
          <Icon className="h-5 w-5" />
        </div>

        <ArrowRight className="h-5 w-5 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-foreground" />
      </div>

      <h2 className="mt-5 font-semibold">
        {title}
      </h2>

      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        {description}
      </p>
    </Link>
  );
}

function StatusMetric({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="px-5 py-5">
      <p className="text-sm text-muted-foreground">
        {label}
      </p>

      <p className="mt-2 text-2xl font-semibold">
        {value.toLocaleString()}
      </p>
    </div>
  );
}