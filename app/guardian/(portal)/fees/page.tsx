import { and, desc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import {
  academicYears,
  feeAssignments,
  feedingFeeCollections,
  payments,
  studentInvoiceItems,
  studentInvoices,
} from "@/db/schema";
import { requireCurrentGuardian } from "@/lib/guardian-auth";
import { getInvoiceFinancials } from "@/lib/finance/finance-utils";
import { GuardianChildSelector } from "../GuardianChildSelector";

function formatDate(value: string | Date | null) {
  if (!value) return "Not available";
  return new Intl.DateTimeFormat("en-GH", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export default async function GuardianFeesPage({
  searchParams,
}: {
  searchParams?: Promise<{ child?: string }>;
}) {
  const params = await searchParams;
  const { children, schoolId } = await requireCurrentGuardian();

  if (children.length === 0) {
    redirect("/guardian/login");
  }

  const selectedChild =
    children.find((child) => child.id === params?.child) ?? children[0];

  const invoices = await db
    .select({
      id: studentInvoices.id,
      invoiceNumber: studentInvoices.invoiceNumber,
      dueDate: studentInvoices.dueDate,
      status: studentInvoices.status,
      amount: studentInvoiceItems.amount,
    })
    .from(studentInvoices)
    .innerJoin(
      studentInvoiceItems,
      eq(studentInvoiceItems.invoiceId, studentInvoices.id),
    )
    .where(
      and(
        eq(studentInvoices.studentId, selectedChild.id),
        eq(studentInvoices.schoolId, schoolId),
      ),
    )
    .orderBy(desc(studentInvoices.dueDate))
    .limit(10);

  const invoiceFinancials = await Promise.all(
    invoices.map(async (invoice) => ({
      ...invoice,
      financials: await getInvoiceFinancials(invoice.id, schoolId),
    })),
  );

  const paymentsSummary = await db
    .select({
      receiptNumber: payments.receiptNumber,
      paymentDate: payments.paymentDate,
      amount: payments.amount,
      method: payments.method,
      status: payments.status,
    })
    .from(payments)
    .where(
      and(
        eq(payments.studentId, selectedChild.id),
        eq(payments.schoolId, schoolId),
      ),
    )
    .orderBy(desc(payments.paymentDate))
    .limit(6);

  const [feedingMode] = await db
    .select({
      mode: feeAssignments.feedingPaymentMode,
      academicYearName: academicYears.name,
    })
    .from(feeAssignments)
    .innerJoin(
      academicYears,
      eq(academicYears.id, feeAssignments.academicYearId),
    )
    .where(
      and(
        eq(feeAssignments.studentId, selectedChild.id),
        eq(feeAssignments.schoolId, schoolId),
        eq(feeAssignments.status, "active"),
      ),
    )
    .orderBy(desc(feeAssignments.assignedAt))
    .limit(1);

  const feedingCollections = await db
    .select({
      collectionDate: feedingFeeCollections.collectionDate,
      amount: feedingFeeCollections.amount,
      receiptNumber: feedingFeeCollections.receiptNumber,
      method: feedingFeeCollections.method,
    })
    .from(feedingFeeCollections)
    .where(
      and(
        eq(feedingFeeCollections.studentId, selectedChild.id),
        eq(feedingFeeCollections.schoolId, schoolId),
      ),
    )
    .orderBy(desc(feedingFeeCollections.collectionDate))
    .limit(10);

  const totalBalance = invoiceFinancials.reduce(
    (sum, entry) => sum + entry.financials.balance,
    0,
  );

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">Fees</p>
          <h1 className="mt-1 text-2xl font-semibold text-slate-950">
            {selectedChild.firstName} {selectedChild.lastName}
          </h1>
        </div>
        <GuardianChildSelector
          childOptions={children}
          selectedChildId={selectedChild.id}
          currentPath="/guardian/fees"
        />
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        <SummaryMetric label="Outstanding" value={`GHS ${totalBalance.toFixed(2)}`} />
        <SummaryMetric label="Invoices" value={String(invoiceFinancials.length)} />
        <SummaryMetric label="Payments" value={String(paymentsSummary.length)} />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-950">Invoices</h2>
          {invoices.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">No fee invoices are available yet.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {invoiceFinancials.map((invoice) => (
                <div key={invoice.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <p className="font-semibold text-slate-900">{invoice.invoiceNumber}</p>
                    <span className="rounded-full bg-slate-200 px-2 py-1 text-xs font-medium text-slate-700">{invoice.status}</span>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">Due {formatDate(invoice.dueDate)}</p>
                  <p className="mt-2 text-base font-semibold text-slate-900">
                    GHS {invoice.financials.balance.toFixed(2)} outstanding
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Total GHS {invoice.financials.total.toFixed(2)} · Paid GHS{" "}
                    {invoice.financials.paid.toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-950">Recent payments</h2>
          {paymentsSummary.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">No payments have been posted for this child yet.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {paymentsSummary.map((payment, index) => (
                <div key={`${payment.receiptNumber}-${index}`} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="font-semibold text-slate-900">{payment.receiptNumber}</p>
                  <p className="mt-1 text-sm text-slate-600">{formatDate(payment.paymentDate)}</p>
                  <p className="mt-2 text-base font-semibold text-slate-900">
                    GHS {Number(payment.amount || 0).toFixed(2)}
                  </p>
                  <p className="mt-1 text-xs capitalize text-slate-500">
                    {payment.method.replaceAll("_", " ")} · {payment.status}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">Feeding fees</h2>
            <p className="mt-1 text-sm text-slate-500">
              {feedingMode
                ? `${feedingMode.mode === "daily" ? "Daily" : "Termly"} payment mode · ${feedingMode.academicYearName}`
                : "No feeding payment mode has been assigned for this child."}
            </p>
          </div>
          <p className="text-sm font-medium text-slate-600">
            {feedingCollections.length} recent collection{feedingCollections.length === 1 ? "" : "s"}
          </p>
        </div>
        {feedingCollections.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">
            No daily feeding collections have been recorded.
          </p>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {feedingCollections.map((collection) => (
              <div key={`${collection.receiptNumber}-${collection.collectionDate}`} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="font-semibold text-slate-900">
                  GHS {Number(collection.amount).toFixed(2)}
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  {formatDate(collection.collectionDate)}
                </p>
                <p className="mt-1 text-xs capitalize text-slate-500">
                  {collection.method.replaceAll("_", " ")} · {collection.receiptNumber}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function SummaryMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-950">{value}</p>
    </div>
  );
}
