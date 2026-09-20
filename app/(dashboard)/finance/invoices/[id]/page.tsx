import Link from "next/link";
import {
  ArrowLeft,
  Ban,
  CircleDollarSign,
  Edit3,
  FileText,
  HandCoins,
} from "lucide-react";
import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import {
  academicYears,
  feeCategories,
  invoiceAdjustments,
  paymentAllocations,
  payments,
  studentInvoiceItems,
  studentInvoices,
  terms,
} from "@/db/schema";
import { getCurrentSchool } from "@/lib/current-school";
import {
  getInvoiceFinancials,
} from "@/lib/finance/finance-utils";
import {
  issueInvoiceAction,
  cancelInvoiceAction,
} from "../../actions";
import {
  createInvoiceAdjustmentAction,
  cancelInvoiceAdjustmentAction,
} from "../../invoice-actions";

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

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-GH", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export default async function InvoiceDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const school = await getCurrentSchool();

  const [invoice] = await db
    .select({
      id: studentInvoices.id,
      invoiceNumber: studentInvoices.invoiceNumber,
      studentId: studentInvoices.studentId,
      academicYearId: studentInvoices.academicYearId,
      termId: studentInvoices.termId,
      issueDate: studentInvoices.issueDate,
      dueDate: studentInvoices.dueDate,
      status: studentInvoices.status,
      notes: studentInvoices.notes,
      createdAt: studentInvoices.createdAt,
      academicYearName: academicYears.name,
      termName: terms.name,
    })
    .from(studentInvoices)
    .leftJoin(
      academicYears,
      eq(academicYears.id, studentInvoices.academicYearId),
    )
    .leftJoin(
      terms,
      eq(terms.id, studentInvoices.termId),
    )
    .where(
      and(
        eq(studentInvoices.id, id),
        eq(studentInvoices.schoolId, school.id),
      ),
    )
    .limit(1);

  if (!invoice) {
    return (
      <main className="p-6 lg:p-8">
        <div className="rounded-xl border bg-card p-8 text-center">
          <h1 className="text-xl font-semibold">
            Invoice not found
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            The requested invoice does not exist or is not
            accessible.
          </p>

          <Link
            href="/finance/invoices"
            className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to invoices
          </Link>
        </div>
      </main>
    );
  }

  const [items, adjustments, allocations] = await Promise.all([
    db
      .select({
        id: studentInvoiceItems.id,
        amount: studentInvoiceItems.amount,
        description: studentInvoiceItems.description,
        categoryName: feeCategories.name,
      })
      .from(studentInvoiceItems)
      .leftJoin(
        feeCategories,
        eq(
          feeCategories.id,
          studentInvoiceItems.feeCategoryId,
        ),
      )
      .where(
        eq(studentInvoiceItems.invoiceId, invoice.id),
      ),

    db
      .select({
        id: invoiceAdjustments.id,
        type: invoiceAdjustments.type,
        amount: invoiceAdjustments.amount,
        reason: invoiceAdjustments.reason,
        status: invoiceAdjustments.status,
        createdAt: invoiceAdjustments.createdAt,
      })
      .from(invoiceAdjustments)
      .where(
        eq(invoiceAdjustments.invoiceId, invoice.id),
      ),

    db
      .select({
        id: paymentAllocations.id,
        amount: paymentAllocations.amount,
        paymentId: paymentAllocations.paymentId,
        receiptNumber: payments.receiptNumber,
        paymentDate: payments.paymentDate,
        paymentMethod: payments.method,
        paymentStatus: payments.status,
      })
      .from(paymentAllocations)
      .innerJoin(
        payments,
        eq(
          payments.id,
          paymentAllocations.paymentId,
        ),
      )
      .where(
        eq(
          paymentAllocations.invoiceId,
          invoice.id,
        ),
      ),
  ]);

  const financials = await getInvoiceFinancials(
    invoice.id,
    school.id,
  );

  const canIssue = invoice.status === "draft";

  const canCancel =
    invoice.status !== "cancelled" &&
    invoice.status !== "paid";

  return (
    <main className="space-y-8 p-6 lg:p-8">
      <section>
        <Link
          href="/finance/invoices"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to invoices
        </Link>

        <div className="mt-5 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <CircleDollarSign className="h-4 w-4" />
              Finance
              <span>/</span>
              Invoices
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-semibold tracking-tight">
                {invoice.invoiceNumber}
              </h1>

              <StatusBadge status={invoice.status} />
            </div>

            <p className="mt-2 text-sm text-muted-foreground">
              Student ID:{" "}
              <span className="font-medium text-foreground">
                {invoice.studentId}
              </span>
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {canIssue && (
              <form
                action={async (formData) => {
                  await issueInvoiceAction(formData);
                }}
              >
                <input
                  type="hidden"
                  name="invoiceId"
                  value={invoice.id}
                />

                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm hover:opacity-90"
                >
                  <FileText className="h-4 w-4" />
                  Issue invoice
                </button>
              </form>
            )}

            {canCancel && (
              <form
                action={async (formData) => {
                  await cancelInvoiceAction(formData);
                }}
              >
                <input
                  type="hidden"
                  name="invoiceId"
                  value={invoice.id}
                />

                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-lg border bg-background px-4 py-2.5 text-sm font-medium shadow-sm hover:bg-muted"
                >
                  <Ban className="h-4 w-4" />
                  Cancel
                </button>
              </form>
            )}

            <Link
              href={`/finance/invoices/${invoice.id}/edit`}
              className="inline-flex items-center gap-2 rounded-lg border bg-background px-4 py-2.5 text-sm font-medium shadow-sm hover:bg-muted"
            >
              <Edit3 className="h-4 w-4" />
              Edit
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <FinancialCard
          label="Subtotal"
          value={formatMoney(financials.subtotal)}
        />

        <FinancialCard
          label="Adjustments"
          value={formatMoney(
            financials.surcharges - financials.discounts,
          )}
        />

        <FinancialCard
          label="Paid"
          value={formatMoney(financials.paid)}
        />

        <FinancialCard
          label="Balance"
          value={formatMoney(financials.balance)}
          emphasis
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          <section className="overflow-hidden rounded-xl border bg-card shadow-sm">
            <div className="border-b px-5 py-4">
              <h2 className="font-semibold">
                Invoice items
              </h2>

              <p className="text-sm text-muted-foreground">
                Charges included in this invoice.
              </p>
            </div>

            {items.length === 0 ? (
              <div className="p-6 text-sm text-muted-foreground">
                No invoice items found.
              </div>
            ) : (
              <div className="divide-y">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-4 px-5 py-4"
                  >
                    <div>
                      <p className="font-medium">
                        {item.categoryName || "Fee"}
                      </p>

                      {item.description && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {item.description}
                        </p>
                      )}
                    </div>

                    <p className="font-semibold">
                      {formatMoney(item.amount)}
                    </p>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between border-t bg-muted/20 px-5 py-4">
              <span className="font-medium">
                Subtotal
              </span>

              <span className="font-semibold">
                {formatMoney(financials.subtotal)}
              </span>
            </div>
          </section>

          <section className="overflow-hidden rounded-xl border bg-card shadow-sm">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <div>
                <h2 className="font-semibold">
                  Payments
                </h2>

                <p className="text-sm text-muted-foreground">
                  Payments allocated to this invoice.
                </p>
              </div>

              <Link
                href={`/finance/payments/new?studentId=${invoice.studentId}&invoiceId=${invoice.id}`}
                className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
              >
                <HandCoins className="h-4 w-4" />
                Record payment
              </Link>
            </div>

            {allocations.length === 0 ? (
              <div className="p-6 text-sm text-muted-foreground">
                No payments have been allocated to this invoice.
              </div>
            ) : (
              <div className="divide-y">
                {allocations.map((allocation) => (
                  <div
                    key={allocation.id}
                    className="flex items-center justify-between gap-4 px-5 py-4"
                  >
                    <div>
                      <p className="font-medium">
                        {allocation.receiptNumber}
                      </p>

                      <p className="mt-1 text-xs capitalize text-muted-foreground">
                        {allocation.paymentMethod.replaceAll(
                          "_",
                          " ",
                        )}{" "}
                        · {formatDate(allocation.paymentDate)}
                      </p>
                    </div>

                    <p className="font-semibold">
                      {formatMoney(allocation.amount)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-xl border bg-card p-5 shadow-sm">
            <h2 className="font-semibold">
              Invoice information
            </h2>

            <dl className="mt-4 space-y-4 text-sm">
              <InfoRow
                label="Student"
                value={invoice.studentId}
              />

              <InfoRow
                label="Academic year"
                value={invoice.academicYearName || "—"}
              />

              <InfoRow
                label="Term"
                value={invoice.termName || "—"}
              />

              <InfoRow
                label="Issue date"
                value={formatDate(invoice.issueDate)}
              />

              <InfoRow
                label="Due date"
                value={formatDate(invoice.dueDate)}
              />
            </dl>

            {invoice.notes && (
              <div className="mt-5 rounded-lg bg-muted/50 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Notes
                </p>

                <p className="mt-2 text-sm leading-6">
                  {invoice.notes}
                </p>
              </div>
            )}
          </section>

          <section className="rounded-xl border bg-card shadow-sm">
            <div className="border-b px-5 py-4">
              <h2 className="font-semibold">
                Adjustments
              </h2>

              <p className="text-sm text-muted-foreground">
                Discounts, waivers and surcharges.
              </p>
            </div>

            <div className="divide-y">
              {adjustments.length === 0 ? (
                <div className="p-5 text-sm text-muted-foreground">
                  No adjustments.
                </div>
              ) : (
                adjustments.map((adjustment) => (
                  <div
                    key={adjustment.id}
                    className="px-5 py-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium capitalize">
                          {adjustment.type}
                        </p>

                        <p className="mt-1 text-xs text-muted-foreground">
                          {adjustment.reason}
                        </p>
                      </div>

                      <p className="font-semibold">
                        {formatMoney(adjustment.amount)}
                      </p>
                    </div>

                    {adjustment.status === "active" && (
                      <form
                        className="mt-3"
                        action={async (formData) => {
                          await cancelInvoiceAdjustmentAction(
                            formData,
                          );
                        }}
                      >
                        <input
                          type="hidden"
                          name="adjustmentId"
                          value={adjustment.id}
                        />

                        <input
                          type="hidden"
                          name="invoiceId"
                          value={invoice.id}
                        />

                        <button
                          type="submit"
                          className="text-xs font-medium text-muted-foreground hover:text-foreground"
                        >
                          Cancel adjustment
                        </button>
                      </form>
                    )}
                  </div>
                ))
              )}
            </div>

            {invoice.status !== "cancelled" &&
              invoice.status !== "paid" && (
                <form
                  action={async (formData) => {
                    await createInvoiceAdjustmentAction(
                      formData,
                    );
                  }}
                  className="space-y-3 border-t p-5"
                >
                  <input
                    type="hidden"
                    name="invoiceId"
                    value={invoice.id}
                  />

                  <select
                    name="type"
                    required
                    defaultValue="discount"
                    className="input-field"
                  >
                    <option value="discount">
                      Discount
                    </option>

                    <option value="waiver">
                      Waiver
                    </option>

                    <option value="surcharge">
                      Surcharge
                    </option>
                  </select>

                  <input
                    name="amount"
                    type="number"
                    min="0.01"
                    step="0.01"
                    required
                    placeholder="Amount"
                    className="input-field"
                  />

                  <input
                    name="reason"
                    required
                    placeholder="Reason"
                    className="input-field"
                  />

                  <button
                    type="submit"
                    className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
                  >
                    Add adjustment
                  </button>
                </form>
              )}
          </section>
        </div>
      </section>
    </main>
  );
}

function FinancialCard({
  label,
  value,
  emphasis = false,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
}) {
  return (
    <div
      className={[
        "rounded-xl border bg-card p-5 shadow-sm",
        emphasis ? "border-primary/20" : "",
      ].join(" ")}
    >
      <p className="text-sm text-muted-foreground">
        {label}
      </p>

      <p className="mt-3 text-2xl font-semibold tracking-tight">
        {value}
      </p>
    </div>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="text-muted-foreground">
        {label}
      </dt>

      <dd className="text-right font-medium">
        {value}
      </dd>
    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: string;
}) {
  const styles: Record<string, string> = {
    draft: "bg-muted text-muted-foreground",
    issued:
      "bg-blue-500/10 text-blue-700 dark:text-blue-400",
    partially_paid:
      "bg-amber-500/10 text-amber-700 dark:text-amber-400",
    paid:
      "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
    overdue:
      "bg-red-500/10 text-red-700 dark:text-red-400",
    cancelled:
      "bg-muted text-muted-foreground line-through",
  };

  return (
    <span
      className={[
        "inline-flex rounded-full px-2.5 py-1 text-xs font-medium capitalize",
        styles[status] || styles.draft,
      ].join(" ")}
    >
      {status.replaceAll("_", " ")}
    </span>
  );
}