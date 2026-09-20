"use client";
import { generateInvoiceAction } from "../../actions";
import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, FileText } from "lucide-react";

type Assignment = {
  id: string;
  studentId: string;
  feeStructureId: string;
  academicYearId: string;
  termId: string;
  studentName: string;
  feeStructureName: string;
  academicYearName: string | null;
  termName: string | null;
};

export default function NewInvoiceForm({
  assignments,
}: {
  assignments: Assignment[];
}) {
  const [assignmentId, setAssignmentId] = useState("");
  const [issueDate, setIssueDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");

  const selectedAssignment = useMemo(
    () =>
      assignments.find(
        (assignment) => assignment.id === assignmentId,
      ),
    [assignments, assignmentId],
  );

  return (
    <form
  action={async (formData) => {
    await generateInvoiceAction(formData);
  }}
  className="space-y-6"
>
      <input
        type="hidden"
        name="action"
        value="generateInvoice"
      />

      <section className="rounded-xl border bg-card p-5 shadow-sm">
        <div className="mb-5">
          <h2 className="font-semibold">Invoice source</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Select an existing fee assignment. The invoice will be
            generated from its fee structure.
          </p>
        </div>

        {assignments.length === 0 ? (
          <div className="rounded-lg border border-dashed p-6 text-center">
            <FileText className="mx-auto h-8 w-8 text-muted-foreground" />

            <p className="mt-3 font-medium">
              No fee assignments available
            </p>

            <p className="mt-1 text-sm text-muted-foreground">
              Assign a fee structure to a student before generating
              an invoice.
            </p>

            <Link
              href="/finance/fee-structures"
              className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
            >
              View fee structures
            </Link>
          </div>
        ) : (
          <div className="space-y-5">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium">
                Fee assignment
                <span className="ml-1 text-destructive">*</span>
              </span>

              <select
                name="feeAssignmentId"
                required
                value={assignmentId}
                onChange={(event) =>
                  setAssignmentId(event.target.value)
                }
                className="input-field"
              >
                <option value="">
                  Select student fee assignment
                </option>

                {assignments.map((assignment) => (
                  <option
                    key={assignment.id}
                    value={assignment.id}
                  >
                    {assignment.studentName} ·{" "}
                    {assignment.feeStructureName}
                    {assignment.termName
                      ? ` · ${assignment.termName}`
                      : ""}
                  </option>
                ))}
              </select>
            </label>

            {selectedAssignment && (
              <div className="grid gap-3 rounded-lg bg-muted/40 p-4 sm:grid-cols-3">
                <Info
                  label="Student ID"
                  value={selectedAssignment.studentId}
                />

                <Info
                  label="Academic year"
                  value={
                    selectedAssignment.academicYearName || "—"
                  }
                />

                <Info
                  label="Term"
                  value={selectedAssignment.termName || "—"}
                />
              </div>
            )}
          </div>
        )}
      </section>

      <section className="rounded-xl border bg-card p-5 shadow-sm">
        <div className="mb-5">
          <h2 className="font-semibold">Invoice details</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Set the invoice dates and any optional notes.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">
              Issue date
              <span className="ml-1 text-destructive">*</span>
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
              value={dueDate}
              min={issueDate || undefined}
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
              placeholder="Optional invoice notes..."
              className="input-field resize-none"
            />
          </label>
        </div>
      </section>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Link
          href="/finance/invoices"
          className="inline-flex items-center justify-center gap-2 rounded-lg border bg-background px-4 py-2.5 text-sm font-medium shadow-sm transition hover:bg-muted"
        >
          <ArrowLeft className="h-4 w-4" />
          Cancel
        </Link>

        <button
          type="submit"
          disabled={!assignmentId}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Check className="h-4 w-4" />
          Generate invoice
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

function Info({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium">{value}</p>
    </div>
  );
}

