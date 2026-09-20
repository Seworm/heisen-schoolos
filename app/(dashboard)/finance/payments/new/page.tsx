import Link from "next/link";
import {
  ArrowLeft,
  CreditCard,
} from "lucide-react";
import { asc, eq } from "drizzle-orm";

import { db } from "@/db";
import {
  studentInvoices,
  students,
} from "@/db/schema";

import { getCurrentSchool } from "@/lib/current-school";
import {
  getInvoiceFinancials,
} from "@/lib/finance/finance-utils";

import NewPaymentForm from "./NewPaymentForm";

export default async function NewPaymentPage() {
  const school =
    await getCurrentSchool();

  const studentsRows =
    await db
      .select({
        id: students.id,
        studentNumber:
          students.studentNumber,
        firstName:
          students.firstName,
        lastName:
          students.lastName,
      })
      .from(students)
      .where(
        eq(
          students.schoolId,
          school.id,
        ),
      )
      .orderBy(
        asc(students.firstName),
        asc(students.lastName),
      );

  const invoiceRows =
    await db
      .select({
        id: studentInvoices.id,
        studentId:
          studentInvoices.studentId,
        invoiceNumber:
          studentInvoices.invoiceNumber,
        issueDate:
          studentInvoices.issueDate,
        dueDate:
          studentInvoices.dueDate,
        status:
          studentInvoices.status,
      })
      .from(studentInvoices)
      .where(
        eq(
  studentInvoices.schoolId,
  school.id,
)
      )
      .orderBy(
        asc(studentInvoices.dueDate),
      );

  const invoices =
    await Promise.all(
      invoiceRows.map(
        async (invoice) => {
          const financials =
            await getInvoiceFinancials(
              invoice.id,
              school.id,
            );

          return {
            id: invoice.id,
            studentId:
              invoice.studentId,
            invoiceNumber:
              invoice.invoiceNumber,
            issueDate:
              invoice.issueDate,
            dueDate:
              invoice.dueDate,
            status:
              financials.status,
            subtotal:
              financials.subtotal,
            discounts:
              financials.discounts,
            surcharges:
              financials.surcharges,
            total:
              financials.total,
            paid:
              financials.paid,
            balance:
              financials.balance,
          };
        },
      ),
    );

  const payableInvoices =
    invoices.filter(
      (invoice) =>
        invoice.status !==
          "cancelled" &&
        invoice.status !== "draft" &&
        invoice.balance >
          0.005,
    );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href="/finance/payments"
            className="mb-3 inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to payments
          </Link>

          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <CreditCard className="h-5 w-5" />
            </div>

            <div>
              <h1 className="text-2xl font-semibold tracking-tight">
                Record payment
              </h1>

              <p className="text-sm text-muted-foreground">
                Record and allocate a student
                payment against outstanding
                invoices.
              </p>
            </div>
          </div>
        </div>
      </div>

      <NewPaymentForm
        students={studentsRows.map(
          (student) => ({
            id: student.id,
            studentNumber:
              student.studentNumber,
            name: [
              student.firstName,
              student.lastName,
            ]
              .filter(Boolean)
              .join(" "),
          }),
        )}
        invoices={payableInvoices}
      />
    </div>
  );
}