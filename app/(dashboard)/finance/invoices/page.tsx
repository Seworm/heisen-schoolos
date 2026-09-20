import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  CircleDollarSign,
  FilePlus2,
  FileText,
  Plus,
  Receipt,
  WalletCards,
} from "lucide-react";
import { count, eq, sql } from "drizzle-orm";

import { db } from "@/db";
import { studentInvoices } from "@/db/schema";
import { getCurrentSchool } from "@/lib/current-school";

function formatDate(value: string | Date | null) {
  if (!value) return "—";

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-GH", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export default async function InvoicesPage() {
  const school = await getCurrentSchool();

  const [invoiceRows, summary] = await Promise.all([
    db
      .select({
        id: studentInvoices.id,
        invoiceNumber: studentInvoices.invoiceNumber,
        studentId: studentInvoices.studentId,
        issueDate: studentInvoices.issueDate,
        dueDate: studentInvoices.dueDate,
        status: studentInvoices.status,
        createdAt: studentInvoices.createdAt,
      })
      .from(studentInvoices)
      .where(eq(studentInvoices.schoolId, school.id))
      .orderBy(sql`${studentInvoices.createdAt} desc`)
      .limit(100),

    db
      .select({
        total: count(),
        issued: sql<number>`
          count(*) filter (
            where ${studentInvoices.status} = 'issued'
          )
        `,
        partiallyPaid: sql<number>`
          count(*) filter (
            where ${studentInvoices.status} = 'partially_paid'
          )
        `,
        paid: sql<number>`
          count(*) filter (
            where ${studentInvoices.status} = 'paid'
          )
        `,
        overdue: sql<number>`
          count(*) filter (
            where ${studentInvoices.status} = 'overdue'
          )
        `,
      })
      .from(studentInvoices)
      .where(eq(studentInvoices.schoolId, school.id)),
  ]);

  const total = Number(summary[0]?.total ?? 0);
  const issued = Number(summary[0]?.issued ?? 0);
  const partiallyPaid = Number(summary[0]?.partiallyPaid ?? 0);
  const paid = Number(summary[0]?.paid ?? 0);
  const overdue = Number(summary[0]?.overdue ?? 0);

  return (
    <main className="space-y-8 p-6 lg:p-8">
      <section className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <CircleDollarSign className="h-4 w-4" />
            Finance
            <span>/</span>
            Invoices
          </div>

          <h1 className="text-3xl font-semibold tracking-tight">
            Invoices
          </h1>

          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Create, issue, review and manage student invoices.
          </p>
        </div>

        <Link
          href="/finance/invoices/new"
          className="inline-flex w-fit items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          New invoice
        </Link>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <SummaryCard
          label="Total"
          value={total.toLocaleString("en-GH")}
          description="Invoices"
          icon={FileText}
        />

        <SummaryCard
          label="Issued"
          value={issued.toLocaleString("en-GH")}
          description="Awaiting payment"
          icon={Receipt}
        />

        <SummaryCard
          label="Partially paid"
          value={partiallyPaid.toLocaleString("en-GH")}
          description="Balance remaining"
          icon={WalletCards}
        />

        <SummaryCard
          label="Paid"
          value={paid.toLocaleString("en-GH")}
          description="Fully settled"
          icon={CheckCircle2}
        />

        <SummaryCard
          label="Overdue"
          value={overdue.toLocaleString("en-GH")}
          description="Past due"
          icon={CircleDollarSign}
        />
      </section>

      <section className="overflow-hidden rounded-xl border bg-card shadow-sm">
        <div className="flex flex-col gap-3 border-b px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold">Invoice register</h2>
            <p className="text-sm text-muted-foreground">
              Latest invoices recorded for this school.
            </p>
          </div>

          <Link
            href="/finance/invoices/new"
            className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
          >
            <FilePlus2 className="h-4 w-4" />
            Create invoice
          </Link>
        </div>

        {invoiceRows.length === 0 ? (
          <div className="flex min-h-72 items-center justify-center px-6 text-center">
            <div className="max-w-md">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
                <FileText className="h-6 w-6 text-muted-foreground" />
              </div>

              <h3 className="mt-4 font-semibold">No invoices yet</h3>

              <p className="mt-2 text-sm text-muted-foreground">
                Create a fee assignment and generate an invoice, or create
                one from the invoice workflow.
              </p>

              <Link
                href="/finance/invoices/new"
                className="mt-5 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90"
              >
                <Plus className="h-4 w-4" />
                Create invoice
              </Link>
            </div>
          </div>
        ) : (
          <div className="divide-y">
            {invoiceRows.map((invoice) => (
              <Link
                key={invoice.id}
                href={`/finance/invoices/${invoice.id}`}
                className="group flex flex-col gap-4 px-5 py-5 transition hover:bg-muted/40 lg:flex-row lg:items-center lg:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-medium">
                      {invoice.invoiceNumber}
                    </h3>

                    <StatusBadge status={invoice.status} />
                  </div>

                  <p className="mt-1 text-xs text-muted-foreground">
                    Student ID: {invoice.studentId}
                  </p>

                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span>
                      Issued: {formatDate(invoice.issueDate)}
                    </span>

                    <span>
                      Due: {formatDate(invoice.dueDate)}
                    </span>
                  </div>
                </div>

                <ArrowRight className="hidden h-4 w-4 shrink-0 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-foreground lg:block" />
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function StatusBadge({
  status,
}: {
  status: string;
}) {
  const styles: Record<string, string> = {
    draft: "bg-muted text-muted-foreground",
    issued: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
    partially_paid:
      "bg-amber-500/10 text-amber-700 dark:text-amber-400",
    paid: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
    overdue: "bg-red-500/10 text-red-700 dark:text-red-400",
    cancelled: "bg-muted text-muted-foreground line-through",
  };

  return (
    <span
      className={[
        "inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium capitalize",
        styles[status] || styles.draft,
      ].join(" ")}
    >
      {status.replaceAll("_", " ")}
    </span>
  );
}

function SummaryCard({
  label,
  value,
  description,
  icon: Icon,
}: {
  label: string;
  value: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-muted-foreground">
          {label}
        </span>

        <div className="rounded-lg bg-muted p-2">
          <Icon className="h-4 w-4" />
        </div>
      </div>

      <p className="mt-4 text-2xl font-semibold tracking-tight">
        {value}
      </p>

      <p className="mt-1 text-xs text-muted-foreground">
        {description}
      </p>
    </div>
  );
}