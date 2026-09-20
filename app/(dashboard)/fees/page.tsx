import { and, count, desc, eq, sql } from "drizzle-orm";

import { db } from "@/db";
import { payments, studentInvoices, students } from "@/db/schema";
import { getCurrentSchool } from "@/lib/current-school";

export const dynamic = "force-dynamic";

export default async function FeesPage() {
  const school = await getCurrentSchool();

  const [
    invoiceStats,
    paymentStats,
    studentStats,
    recentPayments,
  ] = await Promise.all([
    db
      .select({ count: count() })
      .from(studentInvoices)
      .where(eq(studentInvoices.schoolId, school.id)),

    db
      .select({
        total: sql<string>`coalesce(sum(${payments.amount}), 0)`,
      })
      .from(payments)
      .where(
        and(
          eq(payments.schoolId, school.id),
          eq(payments.status, "posted"),
        ),
      ),

    db
      .select({ count: count() })
      .from(students)
      .where(eq(students.schoolId, school.id)),

    db
      .select({
        receiptNumber: payments.receiptNumber,
        amount: payments.amount,
        paymentDate: payments.paymentDate,
        studentName: sql<string>`
          trim(
            coalesce(${students.firstName}, '') ||
            ' ' ||
            coalesce(${students.lastName}, '')
          )
        `,
      })
      .from(payments)
      .innerJoin(
        students,
        eq(students.id, payments.studentId),
      )
      .where(
        and(
          eq(payments.schoolId, school.id),
          eq(payments.status, "posted"),
        ),
      )
      .orderBy(desc(payments.createdAt))
      .limit(10),
  ]);

  const studentCount = studentStats[0]?.count ?? 0;
  const invoiceCount = invoiceStats[0]?.count ?? 0;
  const postedPayments = Number(paymentStats[0]?.total ?? 0);

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div>
        <p className="text-sm font-medium text-slate-500">
          Finance
        </p>

        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">
          Fees & Finance
        </h1>

        <p className="mt-1 max-w-2xl text-sm text-slate-500">
          Invoices, collections, balances and payment history for{" "}
          {school.name}.
        </p>
      </div>

      <section className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Metric
          label="Students"
          value={String(studentCount)}
        />

        <Metric
          label="Invoices"
          value={String(invoiceCount)}
        />

        <Metric
          label="Posted payments"
          value={`GHS ${postedPayments.toFixed(2)}`}
        />
      </section>

      <section className="mt-7 overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="font-semibold text-slate-950">
              Recent payments
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              The latest posted payments recorded by the school.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3">Receipt</th>
                <th className="px-5 py-3">Student</th>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3 text-right">Amount</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {recentPayments.map((payment) => (
                <tr
                  key={payment.receiptNumber}
                  className="transition-colors hover:bg-slate-50"
                >
                  <td className="px-5 py-3 font-medium text-slate-950">
                    {payment.receiptNumber}
                  </td>

                  <td className="px-5 py-3 text-slate-700">
                    {payment.studentName}
                  </td>

                  <td className="px-5 py-3 text-slate-600">
                    {payment.paymentDate}
                  </td>

                  <td className="px-5 py-3 text-right font-medium text-slate-950">
                    GHS {Number(payment.amount).toFixed(2)}
                  </td>
                </tr>
              ))}

              {recentPayments.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-5 py-12 text-center text-slate-500"
                  >
                    No posted payments yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <p className="text-sm text-slate-500">{label}</p>

      <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
        {value}
      </p>
    </div>
  );
}

