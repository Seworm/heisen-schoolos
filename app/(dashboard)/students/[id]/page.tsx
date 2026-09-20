import Link from "next/link";
import { notFound } from "next/navigation";
import { and, desc, eq } from "drizzle-orm";

import GuardianActions from "./guardians/GuardianActions";

import { db } from "@/db";
import {
  academicYears,
  classLevels,
  guardians,
  payments,
  streams,
  studentEnrollments,
  studentGuardians,
  studentInvoices,
  studentPlacements,
  students,
} from "@/db/schema";
import { requireCurrentSchool } from "@/lib/current-school";
import { getInvoiceFinancials } from "@/lib/finance/finance-utils";

export const dynamic = "force-dynamic";

type StudentPageProps = {
  params: Promise<{
    id: string;
  }>;
};

function formatMoney(value: string | number | null | undefined) {
  return new Intl.NumberFormat("en-GH", {
    style: "currency",
    currency: "GHS",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value ?? 0));
}

function formatDate(value: Date | string | null) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString("en-GH", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function placementStatusLabel(status: string) {
  switch (status) {
    case "active":
      return "Active";
    case "completed":
      return "Completed";
    case "transferred":
      return "Transferred";
    case "cancelled":
      return "Cancelled";
    default:
      return status;
  }
}

function placementStatusClass(status: string) {
  switch (status) {
    case "active":
      return "bg-emerald-50 text-emerald-700";
    case "transferred":
      return "bg-amber-50 text-amber-700";
    case "completed":
      return "bg-slate-100 text-slate-700";
    case "cancelled":
      return "bg-red-50 text-red-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

function invoiceStatusLabel(status: string) {
  switch (status) {
    case "draft":
      return "Draft";
    case "issued":
      return "Issued";
    case "partially_paid":
      return "Partially paid";
    case "paid":
      return "Paid";
    case "overdue":
      return "Overdue";
    case "cancelled":
      return "Cancelled";
    default:
      return status;
  }
}

function invoiceStatusClass(status: string) {
  switch (status) {
    case "paid":
      return "bg-emerald-50 text-emerald-700";

    case "partially_paid":
      return "bg-blue-50 text-blue-700";

    case "overdue":
      return "bg-red-50 text-red-700";

    case "issued":
      return "bg-amber-50 text-amber-700";

    case "draft":
      return "bg-slate-100 text-slate-600";

    case "cancelled":
      return "bg-red-50 text-red-600";

    default:
      return "bg-slate-100 text-slate-700";
  }
}

export default async function StudentDetailPage({
  params,
}: StudentPageProps) {
  const { id } = await params;
  const school = await requireCurrentSchool();

  /*
   * --------------------------------------------------------------------------
   * Student
   * --------------------------------------------------------------------------
   */

  const [student] = await db
    .select({
      id: students.id,
      studentNumber: students.studentNumber,
      firstName: students.firstName,
      middleName: students.middleName,
      lastName: students.lastName,
      gender: students.gender,
      dateOfBirth: students.dateOfBirth,
      admissionDate: students.admissionDate,
      phone: students.phone,
      email: students.email,
      createdAt: students.createdAt,
      updatedAt: students.updatedAt,
    })
    .from(students)
    .where(
      and(
        eq(students.id, id),
        eq(students.schoolId, school.id),
      ),
    )
    .limit(1);

  if (!student) {
    notFound();
  }

  /*
   * --------------------------------------------------------------------------
   * Guardians
   * --------------------------------------------------------------------------
   */

  const guardianRows = await db
    .select({
      id: guardians.id,
      firstName: guardians.firstName,
      lastName: guardians.lastName,
      phone: guardians.phone,
      email: guardians.email,
      relationship: studentGuardians.relationship,
      isPrimary: studentGuardians.isPrimary,
    })
    .from(studentGuardians)
    .innerJoin(
      guardians,
      eq(studentGuardians.guardianId, guardians.id),
    )
    .where(
      and(
        eq(studentGuardians.studentId, student.id),
        eq(guardians.schoolId, school.id),
      ),
    );

  /*
   * --------------------------------------------------------------------------
   * Current placement
   * --------------------------------------------------------------------------
   */

  const [currentPlacement] = await db
    .select({
      placementId: studentPlacements.id,
      placementStatus: studentPlacements.status,
      placementStartDate: studentPlacements.startDate,
      placementEndDate: studentPlacements.endDate,

      enrollmentId: studentEnrollments.id,
      admissionNumber: studentEnrollments.admissionNumber,
      enrollmentDate: studentEnrollments.enrollmentDate,
      enrollmentStatus: studentEnrollments.status,

      academicYearId: academicYears.id,
      academicYearName: academicYears.name,

      streamId: streams.id,
      streamName: streams.name,
      capacity: streams.capacity,

      classLevelId: classLevels.id,
      className: classLevels.name,
      classCategory: classLevels.category,
    })
    .from(studentPlacements)
    .innerJoin(
      studentEnrollments,
      eq(
        studentPlacements.studentEnrollmentId,
        studentEnrollments.id,
      ),
    )
    .innerJoin(
      academicYears,
      eq(
        studentEnrollments.academicYearId,
        academicYears.id,
      ),
    )
    .innerJoin(
      streams,
      eq(
        studentPlacements.streamId,
        streams.id,
      ),
    )
    .innerJoin(
      classLevels,
      eq(
        streams.classLevelId,
        classLevels.id,
      ),
    )
    .where(
      and(
        eq(
          studentEnrollments.studentId,
          student.id,
        ),
        eq(
          studentPlacements.status,
          "active",
        ),
        eq(
          academicYears.schoolId,
          school.id,
        ),
        eq(
          classLevels.schoolId,
          school.id,
        ),
      ),
    )
    .limit(1);

  /*
   * --------------------------------------------------------------------------
   * Placement history
   * --------------------------------------------------------------------------
   */

  const placementHistory = await db
    .select({
      placementId: studentPlacements.id,
      placementStatus: studentPlacements.status,
      startDate: studentPlacements.startDate,
      endDate: studentPlacements.endDate,

      academicYearName: academicYears.name,
      admissionNumber: studentEnrollments.admissionNumber,

      className: classLevels.name,
      classCategory: classLevels.category,

      streamName: streams.name,
    })
    .from(studentPlacements)
    .innerJoin(
      studentEnrollments,
      eq(
        studentPlacements.studentEnrollmentId,
        studentEnrollments.id,
      ),
    )
    .innerJoin(
      academicYears,
      eq(
        studentEnrollments.academicYearId,
        academicYears.id,
      ),
    )
    .innerJoin(
      streams,
      eq(
        studentPlacements.streamId,
        streams.id,
      ),
    )
    .innerJoin(
      classLevels,
      eq(
        streams.classLevelId,
        classLevels.id,
      ),
    )
    .where(
      and(
        eq(
          studentEnrollments.studentId,
          student.id,
        ),
        eq(
          academicYears.schoolId,
          school.id,
        ),
        eq(
          classLevels.schoolId,
          school.id,
        ),
      ),
    )
    .orderBy(
      desc(studentPlacements.startDate),
      desc(studentPlacements.createdAt),
    );

  /*
   * --------------------------------------------------------------------------
   * Finance
   *
   * Financial balances are calculated through getInvoiceFinancials()
   * so discounts, waivers, surcharges and posted payments are included.
   * --------------------------------------------------------------------------
   */

  const financeInvoices = await db
    .select({
      id: studentInvoices.id,
      invoiceNumber: studentInvoices.invoiceNumber,
      issueDate: studentInvoices.issueDate,
      dueDate: studentInvoices.dueDate,
      status: studentInvoices.status,
    })
    .from(studentInvoices)
    .where(
      and(
        eq(studentInvoices.schoolId, school.id),
        eq(studentInvoices.studentId, student.id),
      ),
    )
    .orderBy(
      desc(studentInvoices.issueDate),
      desc(studentInvoices.createdAt),
    )
    .limit(100);

  const financialInvoices = await Promise.all(
    financeInvoices.map(async (invoice) => {
      const financials = await getInvoiceFinancials(
        invoice.id,
        school.id,
      );

      return {
        ...invoice,
        ...financials,
      };
    }),
  );

  const activeFinancialInvoices = financialInvoices.filter(
    (invoice) =>
      invoice.status !== "draft" &&
      invoice.status !== "cancelled",
  );

  const totalInvoiced = activeFinancialInvoices.reduce(
    (sum, invoice) => sum + Number(invoice.total),
    0,
  );

  const totalPaid = activeFinancialInvoices.reduce(
    (sum, invoice) => sum + Number(invoice.paid),
    0,
  );

  const totalOutstanding = activeFinancialInvoices.reduce(
    (sum, invoice) => sum + Number(invoice.balance),
    0,
  );

  const overdueInvoices = activeFinancialInvoices.filter(
    (invoice) =>
      invoice.status === "overdue" &&
      invoice.balance > 0.005,
  );

  const overdueAmount = overdueInvoices.reduce(
    (sum, invoice) => sum + Number(invoice.balance),
    0,
  );

  const activeInvoices = activeFinancialInvoices.filter(
    (invoice) => invoice.balance > 0.005,
  );

  /*
   * --------------------------------------------------------------------------
   * Recent payments
   * --------------------------------------------------------------------------
   */

  const recentPayments = await db
    .select({
      id: payments.id,
      receiptNumber: payments.receiptNumber,
      paymentDate: payments.paymentDate,
      amount: payments.amount,
      method: payments.method,
      status: payments.status,
      reference: payments.reference,
    })
    .from(payments)
    .where(
      and(
        eq(payments.schoolId, school.id),
        eq(payments.studentId, student.id),
      ),
    )
    .orderBy(
      desc(payments.paymentDate),
      desc(payments.createdAt),
    )
    .limit(10);

  const postedPaymentCount = recentPayments.filter(
    (payment) => payment.status === "posted",
  ).length;

  /*
   * --------------------------------------------------------------------------
   * Display helpers
   * --------------------------------------------------------------------------
   */

  const fullName = [
    student.firstName,
    student.middleName,
    student.lastName,
  ]
    .filter(Boolean)
    .join(" ");

  const initials =
    `${student.firstName.charAt(0)}${student.lastName.charAt(0)}`.toUpperCase();

  return (
    <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
      {/* Header */}
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-lg font-semibold text-white">
            {initials}
          </div>

          <div>
            <p className="text-sm font-medium text-slate-500">
              Student Profile
            </p>

            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">
              {fullName}
            </h1>

            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                {student.studentNumber}
              </span>

              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                Active
              </span>
            </div>
          </div>
        </div>

        <Link
          href="/students"
          className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          ← Back to Students
        </Link>
      </div>

      {/* School context */}
      <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
          School
        </p>

        <p className="mt-1 text-sm font-medium text-slate-900">
          {school.name}
        </p>
      </div>

      {/* Current Placement */}
      <section className="mt-6 rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-200 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-950">
              Current Placement
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              The student&apos;s current academic-year class and stream
              placement.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {!currentPlacement && (
              <Link
                href={`/students/${student.id}/enrollment/new`}
                className="inline-flex items-center justify-center rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
              >
                Assign Enrollment
              </Link>
            )}

            {currentPlacement && (
              <Link
                href={`/students/${student.id}/placement`}
                className="inline-flex items-center justify-center rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Transfer Student
              </Link>
            )}
          </div>
        </div>

        {currentPlacement ? (
          <div className="grid gap-6 px-6 py-6 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Academic Year
              </p>

              <p className="mt-2 text-sm font-semibold text-slate-950">
                {currentPlacement.academicYearName}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Class
              </p>

              <p className="mt-2 text-sm font-semibold text-slate-950">
                {currentPlacement.className}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Stream
              </p>

              <p className="mt-2 text-sm font-semibold text-slate-950">
                {currentPlacement.streamName}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Capacity
              </p>

              <p className="mt-2 text-sm font-semibold text-slate-950">
                {currentPlacement.capacity ?? "No limit"}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Admission Number
              </p>

              <p className="mt-2 text-sm font-semibold text-slate-950">
                {currentPlacement.admissionNumber || "—"}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Enrollment Date
              </p>

              <p className="mt-2 text-sm font-semibold text-slate-950">
                {formatDate(currentPlacement.enrollmentDate)}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Placement Started
              </p>

              <p className="mt-2 text-sm font-semibold text-slate-950">
                {formatDate(currentPlacement.placementStartDate)}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Status
              </p>

              <span
                className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${placementStatusClass(
                  currentPlacement.placementStatus,
                )}`}
              >
                {placementStatusLabel(
                  currentPlacement.placementStatus,
                )}
              </span>
            </div>
          </div>
        ) : (
          <div className="px-6 py-10 text-center">
            <p className="text-sm font-semibold text-slate-900">
              No current enrollment
            </p>

            <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
              This student has not yet been assigned to an academic
              year, class and stream.
            </p>

            <Link
              href={`/students/${student.id}/enrollment/new`}
              className="mt-4 inline-flex items-center justify-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Assign First Enrollment
            </Link>
          </div>
        )}
      </section>

      {/* Finance */}
      <section className="mt-6 rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-200 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-950">
              Finance
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Fees, payments and outstanding balances for this student.
            </p>
          </div>

          <Link
            href="/finance/invoices"
            className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            View Finance
          </Link>
        </div>

        <div className="grid gap-4 border-b border-slate-100 px-6 py-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Total Invoiced
            </p>

            <p className="mt-2 text-xl font-semibold text-slate-950">
              {formatMoney(totalInvoiced)}
            </p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Total Paid
            </p>

            <p className="mt-2 text-xl font-semibold text-emerald-700">
              {formatMoney(totalPaid)}
            </p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Outstanding
            </p>

            <p className="mt-2 text-xl font-semibold text-slate-950">
              {formatMoney(totalOutstanding)}
            </p>
          </div>

          <div className="rounded-lg border border-red-100 bg-red-50 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-red-600">
              Overdue
            </p>

            <p className="mt-2 text-xl font-semibold text-red-700">
              {formatMoney(overdueAmount)}
            </p>
          </div>
        </div>

        {activeInvoices.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <p className="text-sm font-semibold text-slate-900">
              No outstanding invoices
            </p>

            <p className="mt-1 text-sm text-slate-500">
              This student currently has no unpaid invoice balance.
            </p>
          </div>
        ) : (
          <div>
            <div className="border-b border-slate-100 px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-950">
                    Outstanding invoices
                  </h3>

                  <p className="mt-1 text-xs text-slate-500">
                    {activeInvoices.length} invoice
                    {activeInvoices.length === 1 ? "" : "s"} with an
                    outstanding balance.
                  </p>
                </div>

                <Link
                  href="/finance/invoices"
                  className="text-sm font-medium text-slate-700 hover:text-slate-950"
                >
                  View all
                </Link>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px]">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-left">
                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Invoice
                    </th>

                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Issue Date
                    </th>

                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Due Date
                    </th>

                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Total
                    </th>

                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Paid
                    </th>

                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Balance
                    </th>

                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Status
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {activeInvoices.slice(0, 10).map((invoice) => (
                    <tr
                      key={invoice.id}
                      className="transition hover:bg-slate-50"
                    >
                      <td className="px-6 py-4">
                        <Link
                          href={`/finance/invoices/${invoice.id}`}
                          className="text-sm font-semibold text-slate-950 hover:underline"
                        >
                          {invoice.invoiceNumber}
                        </Link>
                      </td>

                      <td className="px-6 py-4 text-sm text-slate-600">
                        {formatDate(invoice.issueDate)}
                      </td>

                      <td className="px-6 py-4 text-sm text-slate-600">
                        {formatDate(invoice.dueDate)}
                      </td>

                      <td className="px-6 py-4 text-sm font-medium text-slate-900">
                        {formatMoney(invoice.total)}
                      </td>

                      <td className="px-6 py-4 text-sm text-slate-600">
                        {formatMoney(invoice.paid)}
                      </td>

                      <td className="px-6 py-4 text-sm font-semibold text-slate-950">
                        {formatMoney(invoice.balance)}
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${invoiceStatusClass(
                            invoice.status,
                          )}`}
                        >
                          {invoiceStatusLabel(invoice.status)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {/* Placement History */}
      <section className="mt-6 rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-5">
          <h2 className="text-base font-semibold text-slate-950">
            Placement History
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Historical record of the student&apos;s class and stream
            placements.
          </p>
        </div>

        {placementHistory.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <p className="text-sm font-semibold text-slate-900">
              No placement history
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Placement records will appear here once the student is
              enrolled.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-left">
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Academic Year
                  </th>

                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Class
                  </th>

                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Stream
                  </th>

                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Start
                  </th>

                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    End
                  </th>

                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {placementHistory.map((placement) => (
                  <tr
                    key={placement.placementId}
                    className="hover:bg-slate-50"
                  >
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">
                      {placement.academicYearName}
                    </td>

                    <td className="px-6 py-4 text-sm text-slate-700">
                      {placement.className}
                    </td>

                    <td className="px-6 py-4 text-sm text-slate-700">
                      {placement.streamName}
                    </td>

                    <td className="px-6 py-4 text-sm text-slate-600">
                      {formatDate(placement.startDate)}
                    </td>

                    <td className="px-6 py-4 text-sm text-slate-600">
                      {formatDate(placement.endDate)}
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${placementStatusClass(
                          placement.placementStatus,
                        )}`}
                      >
                        {placementStatusLabel(
                          placement.placementStatus,
                        )}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Information grid */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Personal information */}
        <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-5">
            <h2 className="text-base font-semibold text-slate-950">
              Personal Information
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Basic identifying information for this student.
            </p>
          </div>

          <dl className="divide-y divide-slate-100">
            <div className="grid grid-cols-2 gap-4 px-6 py-4">
              <dt className="text-sm text-slate-500">
                First name
              </dt>

              <dd className="text-right text-sm font-medium text-slate-900">
                {student.firstName}
              </dd>
            </div>

            <div className="grid grid-cols-2 gap-4 px-6 py-4">
              <dt className="text-sm text-slate-500">
                Middle name
              </dt>

              <dd className="text-right text-sm font-medium text-slate-900">
                {student.middleName || "—"}
              </dd>
            </div>

            <div className="grid grid-cols-2 gap-4 px-6 py-4">
              <dt className="text-sm text-slate-500">
                Last name
              </dt>

              <dd className="text-right text-sm font-medium text-slate-900">
                {student.lastName}
              </dd>
            </div>

            <div className="grid grid-cols-2 gap-4 px-6 py-4">
              <dt className="text-sm text-slate-500">
                Gender
              </dt>

              <dd className="text-right text-sm font-medium capitalize text-slate-900">
                {student.gender}
              </dd>
            </div>

            <div className="grid grid-cols-2 gap-4 px-6 py-4">
              <dt className="text-sm text-slate-500">
                Date of birth
              </dt>

              <dd className="text-right text-sm font-medium text-slate-900">
                {formatDate(student.dateOfBirth)}
              </dd>
            </div>
          </dl>
        </section>

        {/* Admission information */}
        <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-5">
            <h2 className="text-base font-semibold text-slate-950">
              Admission Information
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              School registration and admission details.
            </p>
          </div>

          <dl className="divide-y divide-slate-100">
            <div className="grid grid-cols-2 gap-4 px-6 py-4">
              <dt className="text-sm text-slate-500">
                Student number
              </dt>

              <dd className="text-right text-sm font-medium text-slate-900">
                {student.studentNumber}
              </dd>
            </div>

            <div className="grid grid-cols-2 gap-4 px-6 py-4">
              <dt className="text-sm text-slate-500">
                Admission date
              </dt>

              <dd className="text-right text-sm font-medium text-slate-900">
                {formatDate(student.admissionDate)}
              </dd>
            </div>

            <div className="grid grid-cols-2 gap-4 px-6 py-4">
              <dt className="text-sm text-slate-500">
                Record created
              </dt>

              <dd className="text-right text-sm font-medium text-slate-900">
                {formatDate(student.createdAt)}
              </dd>
            </div>

            <div className="grid grid-cols-2 gap-4 px-6 py-4">
              <dt className="text-sm text-slate-500">
                Last updated
              </dt>

              <dd className="text-right text-sm font-medium text-slate-900">
                {formatDate(student.updatedAt)}
              </dd>
            </div>
          </dl>
        </section>

        {/* Contact information */}
        <section className="rounded-xl border border-slate-200 bg-white shadow-sm lg:col-span-2">
          <div className="border-b border-slate-200 px-6 py-5">
            <h2 className="text-base font-semibold text-slate-950">
              Contact Information
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Contact details associated with this student.
            </p>
          </div>

          <div className="grid gap-6 px-6 py-6 md:grid-cols-2">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Phone
              </p>

              <p className="mt-2 text-sm font-medium text-slate-900">
                {student.phone || "No phone number recorded"}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Email
              </p>

              <p className="mt-2 text-sm font-medium text-slate-900">
                {student.email || "No email address recorded"}
              </p>
            </div>
          </div>
        </section>

        {/* Guardians */}
        <section className="rounded-xl border border-slate-200 bg-white shadow-sm lg:col-span-2">
          <div className="flex flex-col gap-4 border-b border-slate-200 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-950">
                Guardians
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Parents and guardians associated with this student.
              </p>
            </div>

            <Link
              href={`/students/${student.id}/guardians/new`}
              className="inline-flex items-center justify-center rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              + Add Guardian
            </Link>
          </div>

          {guardianRows.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                +
              </div>

              <p className="mt-4 text-sm font-semibold text-slate-900">
                No guardians recorded
              </p>

              <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
                Add a parent or guardian to this student&apos;s record.
              </p>

              <Link
                href={`/students/${student.id}/guardians/new`}
                className="mt-4 inline-flex items-center justify-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Add First Guardian
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {guardianRows.map((guardian) => (
                <div
                  key={guardian.id}
                  className="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-700">
                      {guardian.firstName.charAt(0)}
                      {guardian.lastName.charAt(0)}
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-slate-950">
                          {guardian.firstName} {guardian.lastName}
                        </p>

                        {guardian.isPrimary && (
                          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                            Primary
                          </span>
                        )}
                      </div>

                      <p className="mt-1 text-sm text-slate-500">
                        {guardian.relationship}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 sm:items-end">
                    <div className="text-sm sm:text-right">
                      <p className="font-medium text-slate-900">
                        {guardian.phone}
                      </p>

                      {guardian.email && (
                        <p className="mt-1 text-slate-500">
                          {guardian.email}
                        </p>
                      )}
                    </div>

                    <GuardianActions
                      studentId={student.id}
                      guardianId={guardian.id}
                      isPrimary={guardian.isPrimary}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Recent payments */}
        <section className="rounded-xl border border-slate-200 bg-white shadow-sm lg:col-span-2">
          <div className="flex flex-col gap-4 border-b border-slate-200 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-950">
                Recent Payments
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Latest payment activity for this student.
              </p>
            </div>

            <div className="text-sm text-slate-500">
              {postedPaymentCount} posted payment
              {postedPaymentCount === 1 ? "" : "s"} shown
            </div>
          </div>

          {recentPayments.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <p className="text-sm font-semibold text-slate-900">
                No payment history
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Payments recorded for this student will appear here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px]">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-left">
                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Receipt
                    </th>

                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Date
                    </th>

                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Method
                    </th>

                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Amount
                    </th>

                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Status
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {recentPayments.map((payment) => (
                    <tr
                      key={payment.id}
                      className="hover:bg-slate-50"
                    >
                      <td className="px-6 py-4">
                        <Link
                          href={`/finance/payments/${payment.id}`}
                          className="text-sm font-semibold text-slate-950 hover:underline"
                        >
                          {payment.receiptNumber}
                        </Link>
                      </td>

                      <td className="px-6 py-4 text-sm text-slate-600">
                        {formatDate(payment.paymentDate)}
                      </td>

                      <td className="px-6 py-4 text-sm capitalize text-slate-700">
                        {payment.method.replaceAll("_", " ")}
                      </td>

                      <td className="px-6 py-4 text-sm font-semibold text-slate-950">
                        {formatMoney(payment.amount)}
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={
                            payment.status === "posted"
                              ? "inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700"
                              : "inline-flex rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700"
                          }
                        >
                          {payment.status === "posted"
                            ? "Posted"
                            : "Reversed"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Upcoming modules */}
        <section className="rounded-xl border border-dashed border-slate-300 bg-slate-50 lg:col-span-2">
          <div className="px-6 py-6">
            <p className="text-sm font-semibold text-slate-900">
              Student records
            </p>

            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
              Attendance, assessments, report cards, communication,
              academic history and other student records will connect
              to this student&apos;s enrollment and placement history as
              those modules are implemented.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}