"use client";
import { updateDraftInvoiceAction } from "../../edit-actions";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  Trash2,
} from "lucide-react";
import { useState } from "react";

type Invoice = {
  id: string;
  invoiceNumber: string;
  studentId: string;
  issueDate: string;
  dueDate: string | null;
  status: string;
  notes: string | null;
};

type InvoiceItem = {
  id: string;
  feeCategoryId: string;
  description: string | null;
  amount: string;
};

export default function EditInvoiceForm({
  invoice,
  items: initialItems,
}: {
  invoice: Invoice;
  items: InvoiceItem[];
}) {
  const [items, setItems] = useState(initialItems);
  const [issueDate, setIssueDate] = useState(
    invoice.issueDate,
  );
  const [dueDate, setDueDate] = useState(
    invoice.dueDate || "",
  );
  const [notes, setNotes] = useState(invoice.notes || "");

  const total = items.reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0,
  );

  function updateItem(
    index: number,
    field: "amount" | "description",
    value: string,
  ) {
    setItems((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index
          ? { ...item, [field]: value }
          : item,
      ),
    );
  }

  function removeItem(index: number) {
    setItems((current) =>
      current.filter((_, itemIndex) => itemIndex !== index),
    );
  }

  return (
    <form
  action={async (formData) => {
    await updateDraftInvoiceAction(formData);
  }}
  className="space-y-6"
>
      <input
        type="hidden"
        name="invoiceId"
        value={invoice.id}
      />

      <input
        type="hidden"
        name="items"
        value={JSON.stringify(
          items.map((item) => ({
            id: item.id,
            amount: item.amount,
            description: item.description || "",
          })),
        )}
      />

      <section className="rounded-xl border bg-card p-5 shadow-sm">
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <p className="text-sm text-muted-foreground">
              Invoice number
            </p>
            <p className="mt-1 font-medium">
              {invoice.invoiceNumber}
            </p>
          </div>

          <div>
            <p className="text-sm text-muted-foreground">
              Student
            </p>
            <p className="mt-1 font-medium">
              {invoice.studentId}
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-xl border bg-card p-5 shadow-sm">
        <div className="mb-5">
          <h2 className="font-semibold">Invoice details</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Draft invoices can be updated before they are issued.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">
              Issue date
            </span>

            <input
              name="issueDate"
              type="date"
              required
              value={issueDate}
              onChange={(event) =>
                setIssueDate(event.target.value)
              }
              className="input-field"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">
              Due date
            </span>

            <input
              name="dueDate"
              type="date"
              min={issueDate || undefined}
              value={dueDate}
              onChange={(event) =>
                setDueDate(event.target.value)
              }
              className="input-field"
            />
          </label>

          <label className="block md:col-span-2">
            <span className="mb-1.5 block text-sm font-medium">
              Notes
            </span>

            <textarea
              name="notes"
              rows={4}
              value={notes}
              onChange={(event) =>
                setNotes(event.target.value)
              }
              className="input-field resize-none"
            />
          </label>
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border bg-card shadow-sm">
        <div className="border-b px-5 py-4">
          <h2 className="font-semibold">Invoice items</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Review the charges before saving the draft.
          </p>
        </div>

        {items.length === 0 ? (
          <div className="p-6 text-center text-sm text-muted-foreground">
            This invoice has no items.
          </div>
        ) : (
          <div className="divide-y">
            {items.map((item, index) => (
              <div
                key={item.id}
                className="grid gap-4 p-5 md:grid-cols-[1fr_180px_auto]"
              >
                <div>
                  <p className="font-medium">
                    {item.description || "Fee item"}
                  </p>

                  <p className="mt-1 text-xs text-muted-foreground">
                    Fee category ID: {item.feeCategoryId}
                  </p>
                </div>

                <label>
                  <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    Amount
                  </span>

                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    required
                    value={item.amount}
                    onChange={(event) =>
                      updateItem(
                        index,
                        "amount",
                        event.target.value,
                      )
                    }
                    className="input-field"
                  />
                </label>

                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-lg border text-muted-foreground transition hover:bg-muted hover:text-foreground"
                    aria-label="Remove invoice item"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between border-t bg-muted/20 px-5 py-4">
          <span className="font-medium">Total</span>

          <span className="text-xl font-semibold">
            {new Intl.NumberFormat("en-GH", {
              style: "currency",
              currency: "GHS",
              minimumFractionDigits: 2,
            }).format(total)}
          </span>
        </div>
      </section>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Link
          href={`/finance/invoices/${invoice.id}`}
          className="inline-flex items-center justify-center gap-2 rounded-lg border bg-background px-4 py-2.5 text-sm font-medium shadow-sm hover:bg-muted"
        >
          <ArrowLeft className="h-4 w-4" />
          Cancel
        </Link>

        <button
          type="submit"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          <Check className="h-4 w-4" />
          Save draft
        </button>
      </div>

      <style jsx>{`
        .input-field {
          width: 100%;
          border-radius: 0.5rem;
          border: 1px solid hsl(var(--border));
          background: hsl(var(--background));
          padding: 0.625rem 0.75rem;
          font-size: 0.875rem;
          outline: none;
        }

        .input-field:focus {
          border-color: hsl(var(--ring));
          box-shadow: 0 0 0 2px hsl(var(--ring) / 0.15);
        }
      `}</style>
    </form>
  );
}