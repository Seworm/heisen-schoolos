import Link from "next/link";
import {
  ArrowRight,
  Banknote,
  BarChart3,
  FileText,
  GraduationCap,
  HandCoins,
  Receipt,
  Settings2,
  WalletCards,
} from "lucide-react";
import { count, desc, eq } from "drizzle-orm";

import { db } from "@/db";
import {
  payments,
  studentInvoices,
  students,
} from "@/db/schema";
import { getCurrentSchool } from "@/lib/current-school";
import { getInvoiceFinancials } from "@/lib/finance/finance-utils";

function formatMoney(value: number | string) {
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
    value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-GH", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export default async function FinancePage() {
  const school = await getCurrentSchool();

  const [
    studentCount,
    invoiceRows,
    recentPayments,
  ] = await Promise.all([
    db
      .select({
        count: count(),
      })
      .from(students)
      .where(eq(students.schoolId, school.id)),

    db
      .select({
        id: studentInvoices.id,
        status: studentInvoices.status,
        dueDate: studentInvoices.dueDate,
      })
      .from(studentInvoices)
      .where(
        eq(studentInvoices.schoolId, school.id),
      ),

    db
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
        status: payments.status,
      })
      .from(payments)
      .innerJoin(
        students,
        eq(students.id, payments.studentId),
      )
      .where(eq(payments.schoolId, school.id))
      .orderBy(desc(payments.createdAt))
      .limit(8),
  ]);

  /*
   * Calculate every invoice through the same authoritative
   * financial engine used by invoice details and reports.
   */
  const invoiceFinancials = await Promise.all(
    invoiceRows.map(async (invoice) => {
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

  const activeInvoices = invoiceFinancials.filter(
    (invoice) =>
      invoice.status !== "cancelled" &&
      invoice.status !== "draft",
  );

  const studentsTotal = Number(
    studentCount[0]?.count ?? 0,
  );

  const invoicesTotal = invoiceRows.length;

  const invoicedAmount = activeInvoices.reduce(
    (sum, invoice) =>
      sum + Number(invoice.total),
    0,
  );

  const collectedAmount = activeInvoices.reduce(
    (sum, invoice) =>
      sum + Number(invoice.paid),
    0,
  );

  const outstandingAmount = activeInvoices.reduce(
    (sum, invoice) =>
      sum + Number(invoice.balance),
    0,
  );

  const now = new Date();

const overdueAmount = activeInvoices.reduce(
  (sum, invoice) => {
    if (!invoice.dueDate) {
      return sum;
    }

    const isOverdue =
      new Date(invoice.dueDate).getTime() <
      now.getTime();

    return isOverdue
      ? sum + Number(invoice.balance)
      : sum;
  },
  0,
);

  const collectionRate =
    invoicedAmount > 0
      ? Math.min(
          100,
          (collectedAmount / invoicedAmount) * 100,
        )
      : 0;

  const quickActions = [
    {
      href: "/finance/invoices/new",
      icon: FileText,
      title: "Create invoice",
      description: "Generate a new student invoice",
    },
    {
      href: "/finance/payments/new",
      icon: HandCoins,
      title: "Record payment",
      description: "Post a student payment",
    },
    {
      href: "/finance/fee-structures/new",
      icon: Settings2,
      title: "Fee structure",
      description: "Configure fees for a class",
    },
  ];

  const modules = [
    {
      href: "/finance/invoices",
      icon: Receipt,
      title: "Invoices",
      description:
        "Create, issue, review and manage student invoices.",
    },
    {
      href: "/finance/payments",
      icon: WalletCards,
      title: "Payments",
      description:
        "Record payments, receipts and payment allocations.",
    },
    {
      href: "/finance/fee-structures",
      icon: Settings2,
      title: "Fee Structures",
      description:
        "Configure fees by academic year, term and class.",
    },
    {
      href: "/finance/feeding",
      icon: HandCoins,
      title: "Feeding Fees",
      description:
        "Set daily class rates and record daily student collections.",
    },
    {
      href: "/finance/cashbook",
      icon: WalletCards,
      title: "Cashbook",
      description:
        "Track school income, expenses and net cash position.",
    },
    {
      href: "/finance/reports",
      icon: BarChart3,
      title: "Financial Reports",
      description:
        "Review collections, outstanding balances and trends.",
    },
  ];

  return (
    <main className="space-y-8 p-6 lg:p-8">
      {/* Header */}
      <section className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Banknote className="h-4 w-4" />
            Finance
          </div>

          <h1 className="text-3xl font-semibold tracking-tight">
            Finance
          </h1>

          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Manage school fees, invoices, payments,
            scholarships and financial reporting from one
            place.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href="/finance/invoices/new"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition hover:opacity-90"
          >
            <FileText className="h-4 w-4" />
            New invoice
          </Link>

          <Link
            href="/finance/payments/new"
            className="inline-flex items-center gap-2 rounded-lg border bg-background px-4 py-2.5 text-sm font-medium shadow-sm transition hover:bg-muted"
          >
            <HandCoins className="h-4 w-4" />
            Record payment
          </Link>
        </div>
      </section>

      {/* KPI cards */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          label="Students"
          value={studentsTotal.toLocaleString("en-GH")}
          description="Students in school"
          icon={GraduationCap}
        />

        <MetricCard
          label="Invoices"
          value={invoicesTotal.toLocaleString("en-GH")}
          description="Invoices recorded"
          icon={FileText}
        />

        <MetricCard
          label="Amount invoiced"
          value={formatMoney(invoicedAmount)}
          description="Authoritative invoice total"
          icon={Receipt}
        />

        <MetricCard
          label="Collected"
          value={formatMoney(collectedAmount)}
          description={`${collectionRate.toFixed(1)}% collected`}
          icon={HandCoins}
        />

        <MetricCard
          label="Outstanding"
          value={formatMoney(outstandingAmount)}
          description="Authoritative balance"
          icon={WalletCards}
          emphasis
        />
      </section>

      {/* Collection overview */}
      <section className="rounded-xl border bg-card p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold">
              Collection overview
            </h2>

            <p className="text-sm text-muted-foreground">
              Payments collected against active invoice
              balances.
            </p>
          </div>

          <span className="text-2xl font-semibold tracking-tight">
            {collectionRate.toFixed(1)}%
          </span>
        </div>

        <div className="mt-5 h-2 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{
              width: `${Math.max(
                0,
                Math.min(100, collectionRate),
              )}%`,
            }}
          />
        </div>

        <div className="mt-3 flex flex-wrap justify-between gap-2 text-xs text-muted-foreground">
          <span>
            {formatMoney(collectedAmount)} collected
          </span>

          <span>
            {formatMoney(outstandingAmount)} outstanding
          </span>
        </div>
      </section>

      {/* Outstanding alert */}
      <section className="grid gap-4 sm:grid-cols-2">
        <FinanceSummaryCard
          label="Outstanding balance"
          value={formatMoney(outstandingAmount)}
          description="Total unpaid balance across active invoices."
          href="/finance/reports/outstanding"
          action="View outstanding"
        />

        <FinanceSummaryCard
          label="Overdue balance"
          value={formatMoney(overdueAmount)}
          description="Outstanding amounts past their due date."
          href="/finance/reports/outstanding"
          action="Review overdue"
        />
      </section>

      {/* Quick actions */}
      <section>
        <div className="mb-4">
          <h2 className="text-lg font-semibold">
            Quick actions
          </h2>

          <p className="text-sm text-muted-foreground">
            Common finance operations.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {quickActions.map((action) => {
            const Icon = action.icon;

            return (
              <Link
                key={action.href}
                href={action.href}
                className="group rounded-xl border bg-card p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <div className="rounded-lg bg-muted p-2.5">
                    <Icon className="h-5 w-5" />
                  </div>

                  <ArrowRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-foreground" />
                </div>

                <h3 className="mt-4 font-medium">
                  {action.title}
                </h3>

                <p className="mt-1 text-sm text-muted-foreground">
                  {action.description}
                </p>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Main workspace */}
      <section className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        {/* Recent payments */}
        <div className="rounded-xl border bg-card shadow-sm">
          <div className="flex items-center justify-between border-b px-5 py-4">
            <div>
              <h2 className="font-semibold">
                Recent payments
              </h2>

              <p className="text-sm text-muted-foreground">
                Latest payment activity.
              </p>
            </div>

            <Link
              href="/finance/payments"
              className="text-sm font-medium text-primary hover:underline"
            >
              View all
            </Link>
          </div>

          {recentPayments.length === 0 ? (
            <div className="flex min-h-48 items-center justify-center px-5 text-center">
              <div>
                <HandCoins className="mx-auto h-8 w-8 text-muted-foreground" />

                <p className="mt-3 text-sm font-medium">
                  No payments recorded
                </p>

                <p className="mt-1 text-sm text-muted-foreground">
                  Recorded payments will appear here.
                </p>
              </div>
            </div>
          ) : (
            <div className="divide-y">
              {recentPayments.map((payment) => {
                const studentName =
                  `${payment.firstName} ${payment.lastName}`.trim();

                return (
                  <Link
                    key={payment.id}
                    href={`/finance/payments/${payment.id}`}
                    className="flex items-center justify-between gap-4 px-5 py-4 transition hover:bg-muted/40"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {studentName || "Unnamed student"}
                      </p>

                      <p className="mt-1 text-xs text-muted-foreground">
                        {payment.studentNumber}
                      </p>

                      <p className="mt-1 text-xs capitalize text-muted-foreground">
                        {payment.receiptNumber} ·{" "}
                        {payment.method.replaceAll("_", " ")}{" "}
                        · {formatDate(payment.paymentDate)}
                      </p>
                    </div>

                    <div className="shrink-0 text-right">
                      <p className="font-semibold">
                        {formatMoney(payment.amount)}
                      </p>

                      <span
                        className={[
                          "mt-1 inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium",
                          payment.status === "posted"
                            ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                            : "bg-muted text-muted-foreground",
                        ].join(" ")}
                      >
                        {payment.status}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Finance modules */}
        <div className="rounded-xl border bg-card shadow-sm">
          <div className="border-b px-5 py-4">
            <h2 className="font-semibold">
              Finance modules
            </h2>

            <p className="text-sm text-muted-foreground">
              Manage the financial operations of the school.
            </p>
          </div>

          <div className="divide-y">
            {modules.map((module) => {
              const Icon = module.icon;

              return (
                <Link
                  key={module.href}
                  href={module.href}
                  className="group flex gap-3 px-5 py-4 transition hover:bg-muted/40"
                >
                  <div className="mt-0.5 rounded-lg bg-muted p-2">
                    <Icon className="h-4 w-4" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-sm font-medium">
                        {module.title}
                      </h3>

                      <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-foreground" />
                    </div>

                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      {module.description}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}

function MetricCard({
  label,
  value,
  description,
  icon: Icon,
  emphasis = false,
}: {
  label: string;
  value: string;
  description: string;
  icon: React.ComponentType<{
    className?: string;
  }>;
  emphasis?: boolean;
}) {
  return (
    <div
      className={[
        "rounded-xl border bg-card p-5 shadow-sm",
        emphasis ? "border-primary/20" : "",
      ].join(" ")}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-muted-foreground">
          {label}
        </span>

        <div className="rounded-lg bg-muted p-2">
          <Icon className="h-4 w-4" />
        </div>
      </div>

      <p className="mt-4 text-xl font-semibold tracking-tight">
        {value}
      </p>

      <p className="mt-1 text-xs text-muted-foreground">
        {description}
      </p>
    </div>
  );
}

function FinanceSummaryCard({
  label,
  value,
  description,
  href,
  action,
}: {
  label: string;
  value: string;
  description: string;
  href: string;
  action: string;
}) {
  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <p className="text-sm text-muted-foreground">
        {label}
      </p>

      <p className="mt-2 text-2xl font-semibold tracking-tight">
        {value}
      </p>

      <p className="mt-1 text-sm text-muted-foreground">
        {description}
      </p>

      <Link
        href={href}
        className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
      >
        {action}
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}