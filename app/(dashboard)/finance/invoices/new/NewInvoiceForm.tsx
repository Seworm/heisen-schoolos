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
      className="finance-form"
    >
      <input
        type="hidden"
        name="action"
        value="generateInvoice"
      />

      <section className="finance-card">
        <div className="finance-card-header">
          <h2 className="finance-card-title">Invoice source</h2>
          <p className="finance-card-description">
            Select an existing fee assignment. The invoice will be
            generated from its fee structure.
          </p>
        </div>
        <div className="finance-card-body">
          {assignments.length === 0 ? (
            <div className="finance-empty">
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
                  className="finance-control"
                >
                  <option value="">
                    Select student fee assignment
                  </option>

                  {assignments.map((assignment) => (
                    <option key={assignment.id} value={assignment.id}>
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
                <div className="finance-selection sm:grid-cols-3">
                  <Info
                    label="Student ID"
                    value={selectedAssignment.studentId}
                  />

                  <Info
                    label="Academic year"
                    value={selectedAssignment.academicYearName || "—"}
                  />

                  <Info
                    label="Term"
                    value={selectedAssignment.termName || "—"}
                  />
                </div>
            )}
            </div>
          )}
        </div>
      </section>

      <section className="finance-card">
        <div className="finance-card-header">
          <h2 className="finance-card-title">Invoice details</h2>
          <p className="finance-card-description">
            Set the invoice dates and any optional notes.
          </p>
        </div>

        <div className="finance-card-body grid gap-5 md:grid-cols-2">
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
              className="finance-control"
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
              className="finance-control"
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
              className="finance-control resize-none"
            />
          </label>
        </div>
      </section>

      <div className="finance-actions">
        <Link
          href="/finance/invoices"
          className="btn btn-secondary"
        >
          <ArrowLeft className="h-4 w-4" />
          Cancel
        </Link>

        <button
          type="submit"
          disabled={!assignmentId}
          className="btn btn-primary"
        >
          <Check className="h-4 w-4" />
          Generate invoice
        </button>
      </div>

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
      <p className="finance-selection-label">{label}</p>
      <p className="finance-selection-value">{value}</p>
    </div>
  );
}
