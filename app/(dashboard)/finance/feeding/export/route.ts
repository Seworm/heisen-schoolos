import { asc, eq } from "drizzle-orm";

import { db } from "@/db";
import {
  classLevels,
  feedingFeeCollections,
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
  await requirePermission("finance.read", school.id);

  const rows = await db
    .select({
      collectionDate: feedingFeeCollections.collectionDate,
      studentNumber: students.studentNumber,
      firstName: students.firstName,
      middleName: students.middleName,
      lastName: students.lastName,
      className: classLevels.name,
      amount: feedingFeeCollections.amount,
      method: feedingFeeCollections.method,
      receiptNumber: feedingFeeCollections.receiptNumber,
      collectedBy: feedingFeeCollections.collectedBy,
      notes: feedingFeeCollections.notes,
      createdAt: feedingFeeCollections.createdAt,
    })
    .from(feedingFeeCollections)
    .innerJoin(students, eq(students.id, feedingFeeCollections.studentId))
    .innerJoin(classLevels, eq(classLevels.id, feedingFeeCollections.classLevelId))
    .where(eq(feedingFeeCollections.schoolId, school.id))
    .orderBy(asc(feedingFeeCollections.collectionDate), asc(students.lastName));

  const header = [
    "Collection date",
    "Student number",
    "Student name",
    "Class",
    "Amount (GHS)",
    "Payment method",
    "Receipt number",
    "Collected by",
    "Notes",
    "Recorded at",
  ];
  const csvRows = rows.map((row) => [
    row.collectionDate,
    row.studentNumber,
    [row.firstName, row.middleName, row.lastName].filter(Boolean).join(" "),
    row.className,
    Number(row.amount).toFixed(2),
    row.method,
    row.receiptNumber,
    row.collectedBy,
    row.notes,
    row.createdAt.toISOString(),
  ]);
  const csv = [header, ...csvRows]
    .map((row) => row.map(csvCell).join(","))
    .join("\r\n");

  return new Response(`\uFEFF${csv}\r\n`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="feeding-fee-collections.csv"',
      "Cache-Control": "no-store",
    },
  });
}
