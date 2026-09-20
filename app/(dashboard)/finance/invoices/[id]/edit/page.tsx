import Link from "next/link";
import {
  ArrowLeft,
  FileText,
} from "lucide-react";
import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import {
  studentInvoiceItems,
  studentInvoices,
} from "@/db/schema";
import { getCurrentSchool } from "@/lib/current-school";
import EditInvoiceForm from "./EditInvoiceForm";

export default async function EditInvoicePage({
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
      issueDate: studentInvoices.issueDate,
      dueDate: studentInvoices.dueDate,
      status: studentInvoices.status,
      notes: studentInvoices.notes,
    })
    .from(studentInvoices)
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

  const items = await db
    .select({
      id: studentInvoiceItems.id,
      feeCategoryId: studentInvoiceItems.feeCategoryId,
      description: studentInvoiceItems.description,
      amount: studentInvoiceItems.amount,
    })
    .from(studentInvoiceItems)
    .where(eq(studentInvoiceItems.invoiceId, invoice.id));

  if (invoice.status !== "draft") {
    return (
      <main className="space-y-8 p-6 lg:p-8">
        <section>
          <Link
            href={`/finance/invoices/${invoice.id}`}
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to invoice
          </Link>
        </section>

        <div className="rounded-xl border bg-card p-8 text-center">
          <FileText className="mx-auto h-8 w-8 text-muted-foreground" />

          <h1 className="mt-4 text-xl font-semibold">
            Invoice cannot be edited
          </h1>

          <p className="mx-auto mt-2 max-w-lg text-sm text-muted-foreground">
            Only draft invoices can be edited. This invoice is
            currently marked as{" "}
            <span className="font-medium text-foreground">
              {invoice.status.replaceAll("_", " ")}
            </span>
            .
          </p>

          <Link
            href={`/finance/invoices/${invoice.id}`}
            className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
          >
            View invoice
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="space-y-8 p-6 lg:p-8">
      <section>
        <Link
          href={`/finance/invoices/${invoice.id}`}
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to invoice
        </Link>

        <div className="mt-5 flex items-start gap-3">
          <div className="rounded-xl bg-muted p-3">
            <FileText className="h-6 w-6" />
          </div>

          <div>
            <h1 className="text-3xl font-semibold tracking-tight">
              Edit Invoice
            </h1>

            <p className="mt-2 text-sm text-muted-foreground">
              {invoice.invoiceNumber} · Student ID:{" "}
              {invoice.studentId}
            </p>
          </div>
        </div>
      </section>

      <EditInvoiceForm
        invoice={invoice}
        items={items}
      />
    </main>
  );
}