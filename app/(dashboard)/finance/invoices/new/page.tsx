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
    <main className="finance-page">
      <Link href="/finance/invoices" className="finance-breadcrumb">
        <ArrowLeft className="h-4 w-4" />
        Back to invoices
      </Link>

      <section className="finance-header">
        <div className="finance-header-content">
          <div className="finance-header-icon">
            <FileText className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">
              Finance workflow
            </p>
            <h1 className="page-title mt-1">Create invoice</h1>
            <p className="page-description max-w-2xl">
              Generate an invoice from an existing student fee assignment.
            </p>
          </div>
        </div>
      </section>

      <NewInvoiceForm assignments={formattedAssignments} />
    </main>
  );
}