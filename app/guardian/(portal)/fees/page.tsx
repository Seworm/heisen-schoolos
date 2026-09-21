import { and, desc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { payments, studentInvoiceItems, studentInvoices } from "@/db/schema";
import { requireCurrentGuardian } from "@/lib/guardian-auth";
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

  const paymentsSummary = await db
    .select({
      receiptNumber: payments.receiptNumber,
      paymentDate: payments.paymentDate,
      amount: payments.amount,
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

  const totalBalance = invoices.reduce((sum, entry) => sum + Number(entry.amount ?? 0), 0);

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
        <SummaryMetric label="Invoices" value={String(invoices.length)} />
        <SummaryMetric label="Payments" value={String(paymentsSummary.length)} />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-950">Invoices</h2>
          {invoices.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">No fee invoices are available yet.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {invoices.map((invoice) => (
                <div key={invoice.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <p className="font-semibold text-slate-900">{invoice.invoiceNumber}</p>
                    <span className="rounded-full bg-slate-200 px-2 py-1 text-xs font-medium text-slate-700">{invoice.status}</span>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">Due {formatDate(invoice.dueDate)}</p>
                  <p className="mt-2 text-base font-semibold text-slate-900">GHS {Number(invoice.amount || 0).toFixed(2)}</p>
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
                  <p className="mt-2 text-base font-semibold text-slate-900">GHS {Number(payment.amount || 0).toFixed(2)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
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

