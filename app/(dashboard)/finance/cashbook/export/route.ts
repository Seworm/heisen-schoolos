import { NextRequest } from "next/server";

import { getCurrentSchool } from "@/lib/current-school";
import { getCashbookReport } from "@/lib/cashbook";

function csvCell(value: unknown) {
  const text = value == null ? "" : String(value);
  return `"${text.replaceAll('"', '""')}"`;
}

export async function GET(request: NextRequest) {
  const school = await getCurrentSchool();
  const params = request.nextUrl.searchParams;
  const report = await getCashbookReport({
    schoolId: school.id,
    from: params.get("from") || undefined,
    to: params.get("to") || undefined,
    category: params.get("category") || undefined,
  });

  const header = [
    "Date",
    "Type",
    "Category",
    "Description",
    "Amount (GHS)",
    "Payment method",
    "Reference",
    "Reversal reason",
    "Reversal of entry",
    "Source payment",
    "Source feeding collection",
  ];
  const rows = report.entries.map((entry) => [
    entry.entryDate,
    entry.entryType,
    entry.category,
    entry.description,
    Number(entry.amount).toFixed(2),
    entry.method,
    entry.reference,
    entry.reversalReason,
    entry.reversalOfId,
    entry.sourcePaymentId,
    entry.sourceFeedingCollectionId,
  ]);
  const csv = [header, ...rows]
    .map((row) => row.map(csvCell).join(","))
    .join("\r\n");
  const suffix = report.from || report.to || report.category ? "-filtered" : "";

  return new Response(`\uFEFF${csv}\r\n`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="cashbook${suffix}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
