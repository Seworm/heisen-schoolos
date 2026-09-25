import { and, asc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Banknote,
  CalendarDays,
  CircleAlert,
  Receipt,
  Trash2,
  Users,
  Wallet,
} from "lucide-react";

import { db } from "@/db";
import {
  payrollItems,
  payrollPeriods,
  payrollRuns,
  staff,
} from "@/db/schema";
import { requireCurrentSchool } from "@/lib/current-school";
import PrintPayrollButton from "./PrintPayrollButton";
import { deletePayrollEntry, markPayrollAsPaid } from "./actions";

export const dynamic = "force-dynamic";

const money = (value: string | number) =>
  new Intl.NumberFormat("en-GH", {
    style: "currency",
    currency: "GHS",
    minimumFractionDigits: 2,
  }).format(Number(value));

function formatDate(value: string | Date | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-GH", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; classes: string }> = {
    draft: { label: "Draft", classes: "border-slate-200 bg-slate-100 text-slate-600" },
    processed: { label: "Processed", classes: "border-emerald-200 bg-emerald-50 text-emerald-700" },
    paid: { label: "Paid", classes: "border-blue-200 bg-blue-50 text-blue-700" },
    void: { label: "Void", classes: "border-rose-200 bg-rose-50 text-rose-700" },
  };
  const style = config[status] ?? config.draft;
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold capitalize ${style.classes}`}
    >
      {style.label}
    </span>
  );
}

export default async function PayrollRunPage({
  params,
}: {
  params: Promise<{ periodId: string }>;
}) {
  const { periodId } = await params;
  const school = await requireCurrentSchool();

  const [period] = await db
    .select()
    .from(payrollPeriods)
    .where(
      and(
        eq(payrollPeriods.id, periodId),
        eq(payrollPeriods.schoolId, school.id),
      ),
    )
    .limit(1);

  if (!period) notFound();

  const [run] = await db
    .select()
    .from(payrollRuns)
    .where(eq(payrollRuns.periodId, period.id))
    .limit(1);

  let staffItems: Array<{
    staffId: string;
    firstName: string;
    lastName: string;
    staffNumber: string;
    position: string | null;
    baseSalary: string;
    allowances: string;
    grossPay: string;
    taxDeduction: string;
    pensionDeduction: string;
    otherDeduction: string;
    totalDeductions: string;
    netPay: string;
  }> = [];

  if (run) {
    staffItems = await db
      .select({
        staffId: staff.id,
        firstName: staff.firstName,
        lastName: staff.lastName,
        staffNumber: staff.staffNumber,
        position: staff.position,
        baseSalary: payrollItems.baseSalary,
        allowances: payrollItems.allowances,
        grossPay: payrollItems.grossPay,
        taxDeduction: payrollItems.taxDeduction,
        pensionDeduction: payrollItems.pensionDeduction,
        otherDeduction: payrollItems.otherDeduction,
        totalDeductions: payrollItems.totalDeductions,
        netPay: payrollItems.netPay,
      })
      .from(payrollItems)
      .innerJoin(staff, eq(payrollItems.staffId, staff.id))
      .where(
        and(
          eq(payrollItems.runId, run.id),
          eq(payrollItems.schoolId, school.id),
        ),
      )
      .orderBy(asc(staff.lastName), asc(staff.firstName));
  }

  const hasProfile = staffItems.length > 0;

  return (
    <>
      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 12mm;
          }

          html,
          body {
            background: white !important;
            color: #0f172a !important;
          }

          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            font-size: 11pt;
          }

          .no-print {
            display: none !important;
          }

          .payroll-shell {
            width: 100% !important;
            max-width: none !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          .payroll-paper {
            border: 0 !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            color: #0f172a !important;
          }

          .payroll-paper table {
            width: 100% !important;
            border-collapse: collapse;
          }

          .payroll-paper th,
          .payroll-paper td {
            padding-top: 0.5rem !important;
            padding-bottom: 0.5rem !important;
          }

          .print-break-inside-avoid {
            break-inside: avoid;
            page-break-inside: avoid;
          }
        }
      `}</style>

      <div className="payroll-shell mx-auto max-w-5xl space-y-6">
        {/* Page controls */}
        <div className="no-print flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <Link
            href="/payroll"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition-colors hover:text-slate-950"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to payroll
          </Link>

          <div className="flex items-center gap-3">
            {period.status === "processed" && (
              <form action={markPayrollAsPaid}>
                <input type="hidden" name="periodId" value={period.id} />
                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-5 py-3 text-sm font-semibold text-blue-700 shadow-sm transition hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  <Wallet className="h-4 w-4" />
                  Mark as paid
                </button>
              </form>
            )}
            {run && (
              <PrintPayrollButton />
            )}
          </div>
        </div>

        {/* Payroll document */}
        <article className="payroll-paper overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {/* Header */}
          <header className="border-b border-slate-200 px-6 py-7 sm:px-10 sm:py-8">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-white">
                    <Receipt className="h-6 w-6" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                      Official payroll
                    </p>
                    <h1 className="mt-1 truncate text-xl font-bold tracking-tight text-slate-950 sm:text-2xl">
                      {school.name}
                    </h1>
                    <p className="mt-1 text-sm text-slate-500">
                      Payroll document generated from the school&apos;s finance records
                    </p>
                  </div>
                </div>
              </div>

              <div className="sm:text-right">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                  Period status
                </p>
                <div className="mt-1">
                  <StatusBadge status={period.status} />
                </div>
              </div>
            </div>
          </header>

          {/* Period details */}
          <section className="grid border-b border-slate-200 sm:grid-cols-2">
            <div className="px-6 py-6 sm:px-10 sm:border-r">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-slate-500" />
                <h2 className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                  Period details
                </h2>
              </div>
              <dl className="mt-4 space-y-2.5 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500">Period name</dt>
                  <dd className="font-semibold text-slate-900">{period.name}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500">Period starts</dt>
                  <dd className="font-semibold text-slate-900">{formatDate(period.periodStart)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500">Period ends</dt>
                  <dd className="font-semibold text-slate-900">{formatDate(period.periodEnd)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500">Pay date</dt>
                  <dd className="font-semibold text-slate-900">{formatDate(period.payDate)}</dd>
                </div>
              </dl>
            </div>

            <div className="px-6 py-6 sm:px-10">
              <div className="flex items-center gap-2">
                <Banknote className="h-4 w-4 text-slate-500" />
                <h2 className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                  Payroll run summary
                </h2>
              </div>
              {run ? (
                <dl className="mt-4 space-y-2.5 text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="text-slate-500">Gross total</dt>
                    <dd className="font-semibold text-slate-900">{money(run.grossTotal)}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-slate-500">Deductions total</dt>
                    <dd className="font-semibold text-slate-900">-{money(run.deductionsTotal)}</dd>
                  </div>
                  <div className="flex justify-between gap-4 border-t border-slate-200 pt-3">
                    <dt className="text-slate-500">Net total</dt>
                    <dd className="text-lg font-bold text-slate-900">{money(run.netTotal)}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-slate-500">Processed by</dt>
                    <dd className="font-semibold text-slate-900">
                      {run.processedBy || "System"}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-slate-500">Processed at</dt>
                    <dd className="font-semibold text-slate-900">{formatDate(run.processedAt)}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-slate-500">Staff paid</dt>
                    <dd className="font-semibold text-slate-900">{staffItems.length}</dd>
                  </div>
                </dl>
              ) : (
                <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  <CircleAlert className="inline-block h-4 w-4" />
                  This period has not been processed yet.
                </div>
              )}
            </div>
          </section>

          {/* Staff payroll items */}
          {run && hasProfile && (
            <section className="px-6 py-7 sm:px-10">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-slate-500" />
                <h2 className="text-sm font-bold text-slate-950">Staff payments</h2>
              </div>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[800px] text-sm">
                  <thead className="bg-slate-50 text-left">
                    <tr>
                      <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">
                        Staff
                      </th>
                      <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">
                        Staff number
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-slate-500">
                        Base
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-slate-500">
                        Allowances
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-slate-500">
                        Gross
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-slate-500">
                        Tax
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-slate-500">
                        Pension
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-slate-500">
                        Other
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-slate-500">
                        Deductions
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-slate-500">
                        Net pay
                      </th>
                      <th className="no-print px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-slate-500">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {staffItems.map((item) => (
                      <tr
                        key={item.staffId}
                        className="print-break-inside-avoid"
                      >
                        <td className="px-4 py-3">
                          <p className="font-semibold text-slate-900">
                            {item.firstName} {item.lastName}
                          </p>
                          <p className="mt-0.5 text-xs text-slate-500">
                            {item.position || "Staff"}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {item.staffNumber}
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-slate-900">
                          {money(item.baseSalary)}
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-slate-900">
                          {money(item.allowances)}
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-slate-900">
                          {money(item.grossPay)}
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-slate-900">
                          -{money(item.taxDeduction)}
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-slate-900">
                          -{money(item.pensionDeduction)}
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-slate-900">
                          -{money(item.otherDeduction)}
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-slate-900">
                          -{money(item.totalDeductions)}
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-slate-900">
                          {money(item.netPay)}
                        </td>
                        <td className="no-print px-4 py-3 text-right">
                          <form action={deletePayrollEntry} className="inline-block">
                            <input type="hidden" name="periodId" value={period.id} />
                            <input type="hidden" name="staffId" value={item.staffId} />
                            <button
                              type="submit"
                              className="inline-flex items-center justify-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-[11px] font-bold text-rose-700 transition hover:bg-rose-100"
                              aria-label={`Delete payroll entry for ${item.firstName} ${item.lastName}`}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Delete
                            </button>
                          </form>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="border-t-2 border-slate-200 bg-slate-50">
                    <tr>
                      <td colSpan={4} className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-slate-500">
                        Total payroll
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-bold text-slate-900">
                        {money(run.grossTotal)}
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-bold text-slate-900">
                        -{money(run.deductionsTotal)}
                      </td>
                      <td colSpan={3} />
                      <td className="px-4 py-3 text-right text-sm font-bold text-slate-900">
                        {money(run.netTotal)}
                      </td>
                      <td className="no-print px-4 py-3" />
                    </tr>
                  </tfoot>
                </table>
              </div>
            </section>
          )}

          {/* Footer */}
          <footer className="border-t border-slate-200 bg-slate-50 px-6 py-6 sm:px-10">
            <div className="flex flex-col justify-between gap-3 text-xs text-slate-500 sm:flex-row sm:items-end">
              <div>
                <p className="font-semibold text-slate-700">
                  Official payroll record
                </p>
                <p className="mt-1">
                  Payroll generated from {school.name}&apos;s payroll records.
                </p>
              </div>
              <div className="sm:text-right">
                <p>
                  Period:{" "}
                  <span className="font-semibold text-slate-700">
                    {period.name}
                  </span>
                </p>
                <p className="mt-1">
                  Printed on{" "}
                  {new Intl.DateTimeFormat("en-GH", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  }).format(new Date())}
                </p>
              </div>
            </div>
          </footer>
        </article>
      </div>
    </>
  );
}
