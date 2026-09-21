import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  feeAssignments,
  feeStructureItems,
  feeStructures,
  studentInvoiceItems,
  studentInvoices,
  students,
} from "@/db/schema";
import {
  getInvoiceFinancials,
  assertDate,
  normaliseText,
  parsePositiveMoney,
  requireUuid,
  today,
} from "./finance-utils";

function generateInvoiceNumber() {
  const date = new Date();
  const year = date.getFullYear();
  const random = Math.floor(100000 + Math.random() * 900000);

  return `INV-${year}-${random}`;
}

export async function assignFeeStructureToStudent(input: {
  schoolId: string;
  studentId: string;
  feeStructureId: string;
  academicYearId: string;
  termId: string;
}) {
  const schoolId = requireUuid(input.schoolId, "School");
  const studentId = requireUuid(input.studentId, "Student");
  const feeStructureId = requireUuid(
    input.feeStructureId,
    "Fee structure",
  );
  const academicYearId = requireUuid(
    input.academicYearId,
    "Academic year",
  );
  const termId = requireUuid(input.termId, "Term");

  const [student] = await db
    .select({
      id: students.id,
    })
    .from(students)
    .where(
      and(
        eq(students.id, studentId),
        eq(students.schoolId, schoolId),
      ),
    )
    .limit(1);

  if (!student) {
    throw new Error("Student not found.");
  }

  const [structure] = await db
    .select({
      id: feeStructures.id,
      academicYearId: feeStructures.academicYearId,
      termId: feeStructures.termId,
    })
    .from(feeStructures)
    .where(
      and(
        eq(feeStructures.id, feeStructureId),
        eq(feeStructures.schoolId, schoolId),
      ),
    )
    .limit(1);

  if (!structure) {
    throw new Error("Fee structure not found.");
  }

  if (
    structure.academicYearId !== academicYearId ||
    structure.termId !== termId
  ) {
    throw new Error(
      "The fee structure does not match the selected academic year and term.",
    );
  }

  const existing = await db
    .select({ id: feeAssignments.id })
    .from(feeAssignments)
    .where(
      and(
        eq(feeAssignments.schoolId, schoolId),
        eq(feeAssignments.studentId, studentId),
        eq(feeAssignments.feeStructureId, feeStructureId),
        eq(feeAssignments.termId, termId),
      ),
    )
    .limit(1);

  if (existing.length > 0) {
    throw new Error("This fee structure is already assigned to the student.");
  }

  const [assignment] = await db
    .insert(feeAssignments)
    .values({
      schoolId,
      studentId,
      feeStructureId,
      academicYearId,
      termId,
      status: "active",
    })
    .returning();

  return assignment;
}

export async function generateInvoiceForAssignment(input: {
  schoolId: string;
  feeAssignmentId: string;
  issueDate?: string;
  dueDate?: string;
  notes?: string;
}) {
  const schoolId = requireUuid(input.schoolId, "School");
  const feeAssignmentId = requireUuid(
    input.feeAssignmentId,
    "Fee assignment",
  );

  const issueDate = assertDate(
    input.issueDate ?? today(),
    "Issue date",
  );
  const dueDate = input.dueDate
    ? assertDate(input.dueDate, "Due date")
    : undefined;

  if (dueDate && dueDate < issueDate) {
    throw new Error(
      "Due date cannot be earlier than the issue date.",
    );
  }

  const [assignment] = await db
    .select({
      id: feeAssignments.id,
      studentId: feeAssignments.studentId,
      academicYearId: feeAssignments.academicYearId,
      termId: feeAssignments.termId,
      feeStructureId: feeAssignments.feeStructureId,
    })
    .from(feeAssignments)
    .where(
      and(
        eq(feeAssignments.id, feeAssignmentId),
        eq(feeAssignments.schoolId, schoolId),
        eq(feeAssignments.status, "active"),
      ),
    )
    .limit(1);

  if (!assignment) {
    throw new Error("Active fee assignment not found.");
  }

  const items = await db
    .select({
      feeCategoryId: feeStructureItems.feeCategoryId,
      description: feeStructureItems.description,
      amount: feeStructureItems.amount,
    })
    .from(feeStructureItems)
    .where(
      eq(
        feeStructureItems.feeStructureId,
        assignment.feeStructureId,
      ),
    );

  if (!items.length) {
    throw new Error("The fee structure has no fee items.");
  }

  const invoiceNumber = generateInvoiceNumber();

  return db.transaction(async (tx) => {
    const [invoice] = await tx
      .insert(studentInvoices)
      .values({
        schoolId,
        studentId: assignment.studentId,
        academicYearId: assignment.academicYearId,
        termId: assignment.termId,
        invoiceNumber,
        issueDate,
        dueDate: dueDate || null,
        status: "draft",
        notes: normaliseText(input.notes),
      })
      .returning();

    if (!invoice) {
      throw new Error("Failed to create invoice.");
    }

    await tx.insert(studentInvoiceItems).values(
      items.map((item) => ({
        invoiceId: invoice.id,
        feeCategoryId: item.feeCategoryId,
        description:
          item.description?.trim() || "School fees",
        amount: parsePositiveMoney(item.amount, "Invoice amount"),
      })),
    );

    await tx
      .update(studentInvoices)
      .set({
        status: "issued",
        updatedAt: new Date(),
      })
      .where(eq(studentInvoices.id, invoice.id));

    return invoice;
  });
}

export async function issueInvoice(
  schoolId: string,
  invoiceId: string,
) {
  requireUuid(schoolId, "School");
  requireUuid(invoiceId, "Invoice");

  const financials = await getInvoiceFinancials(
    invoiceId,
    schoolId,
  );

  if (financials.status === "cancelled") {
    throw new Error("A cancelled invoice cannot be issued.");
  }

  if (financials.total <= 0) {
    throw new Error("An invoice must have a positive total.");
  }

  const [invoice] = await db
    .update(studentInvoices)
    .set({
      status: "issued",
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(studentInvoices.id, invoiceId),
        eq(studentInvoices.schoolId, schoolId),
      ),
    )
    .returning();

  if (!invoice) {
    throw new Error("Invoice not found.");
  }

  return invoice;
}

export async function cancelInvoice(
  schoolId: string,
  invoiceId: string,
) {
  requireUuid(schoolId, "School");
  requireUuid(invoiceId, "Invoice");

  const financials = await getInvoiceFinancials(
    invoiceId,
    schoolId,
  );

  if (financials.paid > 0) {
    throw new Error(
      "An invoice with posted payments cannot be cancelled.",
    );
  }

  const [invoice] = await db
    .update(studentInvoices)
    .set({
      status: "cancelled",
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(studentInvoices.id, invoiceId),
        eq(studentInvoices.schoolId, schoolId),
      ),
    )
    .returning();

  if (!invoice) {
    throw new Error("Invoice not found.");
  }

  return invoice;
}

export async function getStudentInvoices(
  schoolId: string,
  studentId: string,
) {
  requireUuid(schoolId, "School");
  requireUuid(studentId, "Student");

  const invoices = await db
    .select()
    .from(studentInvoices)
    .where(
      and(
        eq(studentInvoices.schoolId, schoolId),
        eq(studentInvoices.studentId, studentId),
      ),
    )
    .orderBy(desc(studentInvoices.issueDate));

  return Promise.all(
    invoices.map(async (invoice) => ({
      ...invoice,
      financials: await getInvoiceFinancials(
        invoice.id,
        schoolId,
      ),
    })),
  );
}