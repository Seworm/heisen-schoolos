"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react";

import { recordPaymentAction } from "../../actions";

type Student = {
  id: string;
  studentNumber: string;
  name: string;
};

type Invoice = {
  id: string;
  studentId: string;
  invoiceNumber: string;
  issueDate: string | Date;
  dueDate: string | Date | null;
  status:
    | "issued"
    | "partially_paid"
    | "overdue"
    | "paid"
    | "draft"
    | "cancelled";
  subtotal: number;
  discounts: number;
  surcharges: number;
  total: number;
  paid: number;
  balance: number;
};

type Allocation = {
  invoiceId: string;
  amount: string;
};

type Props = {
  students: Student[];
  invoices: Invoice[];
};

function formatMoney(value: number) {
  return new Intl.NumberFormat(
    "en-GH",
    {
      style: "currency",
      currency: "GHS",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    },
  ).format(value);
}

function formatDate(
  value: string | Date | null,
) {
  if (!value) return "—";

  const date =
    value instanceof Date
      ? value
      : new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    "en-GH",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    },
  ).format(date);
}

export default function NewPaymentForm({
  students,
  invoices,
}: Props) {
  const router = useRouter();

  const [studentId, setStudentId] =
    useState("");

  const [amount, setAmount] =
    useState("");

  const [method, setMethod] =
    useState<
      | "cash"
      | "mobile_money"
      | "bank_transfer"
      | "card"
      | "other"
    >("cash");

  const [paymentDate, setPaymentDate] =
    useState(
      new Date()
        .toISOString()
        .slice(0, 10),
    );

  const [reference, setReference] =
    useState("");

  const [notes, setNotes] =
    useState("");

  const [allocations, setAllocations] =
    useState<Allocation[]>([]);

  const [error, setError] =
    useState("");

  const [submitting, setSubmitting] =
    useState(false);

  const studentInvoices =
    useMemo(
      () =>
        invoices.filter(
          (invoice) =>
            invoice.studentId ===
            studentId,
        ),
      [invoices, studentId],
    );

  const allocatedTotal =
    allocations.reduce(
      (sum, allocation) =>
        sum +
        Number(
          allocation.amount || 0,
        ),
      0,
    );

  const paymentAmount =
    Number(amount || 0);

  const remaining =
    paymentAmount -
    allocatedTotal;

  function addAllocation() {
    const available =
      studentInvoices.find(
        (invoice) =>
          !allocations.some(
            (allocation) =>
              allocation.invoiceId ===
              invoice.id,
          ),
      );

    if (!available) return;

    setAllocations((current) => [
      ...current,
      {
        invoiceId:
          available.id,
        amount:
          available.balance.toFixed(
            2,
          ),
      },
    ]);
  }

  function removeAllocation(
    invoiceId: string,
  ) {
    setAllocations((current) =>
      current.filter(
        (allocation) =>
          allocation.invoiceId !==
          invoiceId,
      ),
    );
  }

  function updateAllocation(
    invoiceId: string,
    value: string,
  ) {
    setAllocations((current) =>
      current.map((allocation) =>
        allocation.invoiceId ===
        invoiceId
          ? {
              ...allocation,
              amount: value,
            }
          : allocation,
      ),
    );
  }

  function updateStudent(
    value: string,
  ) {
    setStudentId(value);
    setAllocations([]);
  }

  async function submit(
    formData: FormData,
  ) {
    setError("");
    setSubmitting(true);

    try {
      if (!studentId) {
        throw new Error(
          "Select a student.",
        );
      }

      if (
        !Number.isFinite(
          paymentAmount,
        ) ||
        paymentAmount <= 0
      ) {
        throw new Error(
          "Enter a valid payment amount.",
        );
      }

      if (!allocations.length) {
        throw new Error(
          "Add at least one invoice allocation.",
        );
      }

      if (
        Math.abs(remaining) >
        0.005
      ) {
        throw new Error(
          "Payment amount must equal the total allocated amount.",
        );
      }

      formData.set(
        "allocations",
        JSON.stringify(
          allocations.map(
            (allocation) => ({
              invoiceId:
                allocation.invoiceId,
              amount:
                Number(
                  allocation.amount,
                ).toFixed(2),
            }),
          ),
        ),
      );

      await recordPaymentAction(
        formData,
      );

      router.push(
        "/finance/payments",
      );
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to record payment.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      action={submit}
      className="space-y-6"
    >
      {error ? (
        <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}

      <div className="rounded-2xl border bg-card p-6 shadow-sm">
        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <label
              htmlFor="studentId"
              className="text-sm font-medium"
            >
              Student
            </label>

            <select
              id="studentId"
              name="studentId"
              value={studentId}
              onChange={(event) =>
                updateStudent(
                  event.target.value,
                )
              }
              className="w-full rounded-xl border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
              required
            >
              <option value="">
                Select student
              </option>

              {students.map(
                (student) => (
                  <option
                    key={student.id}
                    value={student.id}
                  >
                    {student.studentNumber} —{" "}
                    {student.name}
                  </option>
                ),
              )}
            </select>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="amount"
              className="text-sm font-medium"
            >
              Payment amount
            </label>

            <input
              id="amount"
              name="amount"
              type="number"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(event) =>
                setAmount(
                  event.target.value,
                )
              }
              className="w-full rounded-xl border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="0.00"
              required
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="paymentDate"
              className="text-sm font-medium"
            >
              Payment date
            </label>

            <input
              id="paymentDate"
              name="paymentDate"
              type="date"
              value={paymentDate}
              onChange={(event) =>
                setPaymentDate(
                  event.target.value,
                )
              }
              className="w-full rounded-xl border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
              required
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="method"
              className="text-sm font-medium"
            >
              Payment method
            </label>

            <select
              id="method"
              name="method"
              value={method}
              onChange={(event) =>
                setMethod(
                  event.target
                    .value as typeof method,
                )
              }
              className="w-full rounded-xl border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="cash">
                Cash
              </option>
              <option value="mobile_money">
                Mobile money
              </option>
              <option value="bank_transfer">
                Bank transfer
              </option>
              <option value="card">
                Card
              </option>
              <option value="other">
                Other
              </option>
            </select>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="reference"
              className="text-sm font-medium"
            >
              Reference
            </label>

            <input
              id="reference"
              name="reference"
              value={reference}
              onChange={(event) =>
                setReference(
                  event.target.value,
                )
              }
              className="w-full rounded-xl border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="Transaction/reference number"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label
              htmlFor="notes"
              className="text-sm font-medium"
            >
              Notes
            </label>

            <textarea
              id="notes"
              name="notes"
              value={notes}
              onChange={(event) =>
                setNotes(
                  event.target.value,
                )
              }
              rows={3}
              className="w-full rounded-xl border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="Optional payment notes"
            />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border bg-card shadow-sm">
        <div className="flex flex-col gap-3 border-b p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold">
              Invoice allocation
            </h2>

            <p className="text-sm text-muted-foreground">
              Allocate the payment to one or
              more outstanding invoices.
            </p>
          </div>

          <button
            type="button"
            onClick={addAllocation}
            disabled={
              !studentId ||
              studentInvoices.every(
                (invoice) =>
                  allocations.some(
                    (allocation) =>
                      allocation.invoiceId ===
                      invoice.id,
                  ),
              )
            }
            className="inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            Add invoice
          </button>
        </div>

        <div className="p-6">
          {!studentId ? (
            <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
              Select a student to view
              outstanding invoices.
            </div>
          ) : studentInvoices.length ===
            0 ? (
            <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
              This student has no
              outstanding invoices.
            </div>
          ) : allocations.length ===
            0 ? (
            <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
              Click “Add invoice” to
              allocate this payment.
            </div>
          ) : (
            <div className="space-y-4">
              {allocations.map(
                (allocation) => {
                  const invoice =
                    studentInvoices.find(
                      (item) =>
                        item.id ===
                        allocation.invoiceId,
                    );

                  if (!invoice) {
                    return null;
                  }

                  return (
                    <div
                      key={
                        invoice.id
                      }
                      className="rounded-xl border p-4"
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              {
                                invoice.invoiceNumber
                              }
                            </span>

                            <span className="rounded-full bg-muted px-2 py-0.5 text-xs">
                              {
                                invoice.status
                              }
                            </span>
                          </div>

                          <p className="mt-1 text-xs text-muted-foreground">
                            Due{" "}
                            {formatDate(
                              invoice.dueDate,
                            )}
                          </p>

                          <div className="mt-2 text-sm">
                            Outstanding:{" "}
                            <span className="font-semibold">
                              {formatMoney(
                                invoice.balance,
                              )}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="0.01"
                            max={invoice.balance}
                            step="0.01"
                            value={
                              allocation.amount
                            }
                            onChange={(
                              event,
                            ) =>
                              updateAllocation(
                                invoice.id,
                                event
                                  .target
                                  .value,
                              )
                            }
                            className="w-40 rounded-xl border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                          />

                          <button
                            type="button"
                            onClick={() =>
                              removeAllocation(
                                invoice.id,
                              )
                            }
                            className="rounded-xl p-2.5 text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                            aria-label="Remove invoice"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                },
              )}
            </div>
          )}
        </div>

        <div className="border-t bg-muted/30 p-6">
          <div className="flex flex-col gap-2 text-sm sm:ml-auto sm:max-w-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                Payment
              </span>
              <span className="font-medium">
                {formatMoney(
                  paymentAmount,
                )}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-muted-foreground">
                Allocated
              </span>
              <span className="font-medium">
                {formatMoney(
                  allocatedTotal,
                )}
              </span>
            </div>

            <div className="flex justify-between border-t pt-2">
              <span className="font-medium">
                Remaining
              </span>

              <span
                className={
                  Math.abs(
                    remaining,
                  ) <= 0.005
                    ? "font-semibold text-emerald-600"
                    : "font-semibold text-destructive"
                }
              >
                {formatMoney(
                  Math.abs(
                    remaining,
                  ),
                )}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={
            submitting ||
            !studentId ||
            !allocations.length ||
            Math.abs(
              remaining,
            ) > 0.005
          }
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <CheckCircle2 className="h-4 w-4" />
          )}

          {submitting
            ? "Recording..."
            : "Record payment"}
        </button>
      </div>
    </form>
  );
}