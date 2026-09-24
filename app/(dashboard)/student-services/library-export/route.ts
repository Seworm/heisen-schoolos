import { asc, eq } from "drizzle-orm";

import { db } from "@/db";
import {
  libraryBooks,
  libraryLoans,
  students,
} from "@/db/schema";
import { requirePermission } from "@/lib/authorization";
import { requireCurrentSchool } from "@/lib/current-school";

function csvCell(value: unknown) {
  const text = value == null ? "" : String(value);
  return `"${text.replaceAll('"', '""')}"`;
}

export async function GET() {
  const school = await requireCurrentSchool();
  await requirePermission("operations.read", school.id);

  const rows = await db
    .select({
      title: libraryBooks.title,
      author: libraryBooks.author,
      isbn: libraryBooks.isbn,
      studentNumber: students.studentNumber,
      firstName: students.firstName,
      middleName: students.middleName,
      lastName: students.lastName,
      issuedAt: libraryLoans.issuedAt,
      dueAt: libraryLoans.dueAt,
      returnedAt: libraryLoans.returnedAt,
      status: libraryLoans.status,
    })
    .from(libraryLoans)
    .innerJoin(
      libraryBooks,
      eq(libraryBooks.id, libraryLoans.bookId),
    )
    .innerJoin(
      students,
      eq(students.id, libraryLoans.studentId),
    )
    .where(eq(libraryLoans.schoolId, school.id))
    .orderBy(asc(libraryLoans.dueAt), asc(students.lastName));

  const header = [
    "Book title",
    "Author",
    "ISBN",
    "Student number",
    "Student name",
    "Issued at",
    "Due date",
    "Returned at",
    "Status",
  ];
  const csvRows = rows.map((row) => [
    row.title,
    row.author,
    row.isbn,
    row.studentNumber,
    [row.firstName, row.middleName, row.lastName]
      .filter(Boolean)
      .join(" "),
    row.issuedAt.toISOString(),
    row.dueAt,
    row.returnedAt?.toISOString() ?? "",
    row.status,
  ]);
  const csv = [header, ...csvRows]
    .map((row) => row.map(csvCell).join(","))
    .join("\r\n");

  return new Response(`\uFEFF${csv}\r\n`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="library-loans.csv"',
      "Cache-Control": "no-store",
    },
  });
}
