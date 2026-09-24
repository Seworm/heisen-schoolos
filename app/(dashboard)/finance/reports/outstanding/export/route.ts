import { and, asc, eq } from "drizzle-orm";

import { db } from "@/db";
import { studentInvoices, students } from "@/db/schema";
import { requireCurrentSchool } from "@/lib/current-school";
import { getInvoiceFinancials } from "@/lib/finance/finance-utils";

function csvCell(value: unknown) {
  const text = value == null ? "" : String(value);
  return `"${text.replaceAll('"', '""')}"`;
}

export async function GET() {
  const school = await requireCurrentSchool();
  const invoices = await db
    .select({
      id: studentInvoices.id,
      invoiceNumber: studentInvoices.invoiceNumber,
      studentNumber: students.studentNumber,
      firstName: students.firstName,
      middleName: students.middleName,
      lastName: students.lastName,
      issueDate: studentInvoices.issueDate,
      dueDate: studentInvoices.dueDate,
      status: studentInvoices.status,
    })
    .from(studentInvoices)
    .innerJoin(students, eq(students.id, studentInvoices.studentId))
    .where(and(
      eq(studentInvoices.schoolId, school.id),
      eq(students.schoolId, school.id),
    ))
    .orderBy(asc(studentInvoices.dueDate));

  const rows = await Promise.all(
    invoices.map(async (invoice) => ({
      ...invoice,
      financials: await getInvoiceFinancials(invoice.id, school.id),
    })),
  );
  const outstanding = rows.filter((row) =>
    row.status !== "cancelled" &&
    row.status !== "draft" &&
    row.financials.balance > 0.005,
  );
  const now = new Date();
  const header = [
    "Invoice number",
    "Student number",
    "Student name",
    "Issue date",
    "Due date",
    "Status",
    "Invoice total (GHS)",
    "Paid (GHS)",
    "Outstanding (GHS)",
    "Overdue",
  ];
  const csvRows = outstanding.map((row) => [
    row.invoiceNumber,
    row.studentNumber,
    [row.firstName, row.middleName, row.lastName].filter(Boolean).join(" "),
    row.issueDate,
    row.dueDate,
    row.financials.status,
    Number(row.financials.total).toFixed(2),
    Number(row.financials.paid).toFixed(2),
    Number(row.financials.balance).toFixed(2),
    row.dueDate ? new Date(`${row.dueDate}T23:59:59.999Z`) < now ? "Yes" : "No" : "No",
  ]);
  const csv = [header, ...csvRows]
    .map((row) => row.map(csvCell).join(","))
    .join("\r\n");

  return new Response(`\uFEFF${csv}\r\n`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="outstanding-balances.csv"',
      "Cache-Control": "no-store",
    },
  });
}
