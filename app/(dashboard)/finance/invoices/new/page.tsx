import Link from "next/link";
import {
  ArrowLeft,
  FileText,
} from "lucide-react";
import { asc, eq } from "drizzle-orm";

import { db } from "@/db";
import {
  academicYears,
  feeAssignments,
  feeStructures,
  students,
  terms,
} from "@/db/schema";
import { getCurrentSchool } from "@/lib/current-school";
import NewInvoiceForm from "./NewInvoiceForm";

export default async function NewInvoicePage() {
  const school = await getCurrentSchool();

  const assignments = await db
    .select({
      id: feeAssignments.id,
      studentId: feeAssignments.studentId,
      feeStructureId: feeAssignments.feeStructureId,
      academicYearId: feeAssignments.academicYearId,
      termId: feeAssignments.termId,

      studentName: students.firstName,
      studentLastName: students.lastName,

      feeStructureName: feeStructures.name,
      academicYearName: academicYears.name,
      termName: terms.name,
    })
    .from(feeAssignments)
    .innerJoin(
      students,
      eq(students.id, feeAssignments.studentId),
    )
    .innerJoin(
      feeStructures,
      eq(feeStructures.id, feeAssignments.feeStructureId),
    )
    .leftJoin(
      academicYears,
      eq(academicYears.id, feeAssignments.academicYearId),
    )
    .leftJoin(
      terms,
      eq(terms.id, feeAssignments.termId),
    )
    .where(eq(feeAssignments.schoolId, school.id))
    .orderBy(asc(feeAssignments.assignedAt))
    .limit(500);

  const formattedAssignments = assignments.map((assignment) => ({
    ...assignment,
    studentName: `${assignment.studentName} ${
      assignment.studentLastName
    }`.trim(),
  }));

  return (
    <main className="space-y-8 p-6 lg:p-8">
      <section>
        <Link
          href="/finance/invoices"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to invoices
        </Link>

        <div className="mt-5 flex items-start gap-3">
          <div className="rounded-xl bg-muted p-3">
            <FileText className="h-6 w-6" />
          </div>

          <div>
            <h1 className="text-3xl font-semibold tracking-tight">
              New Invoice
            </h1>

            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Generate an invoice from an existing student fee
              assignment.
            </p>
          </div>
        </div>
      </section>

      <NewInvoiceForm assignments={formattedAssignments} />
    </main>
  );
}