import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { inventoryItems } from "@/db/schema";
import { getCurrentSchool } from "@/lib/current-school";

function csvCell(value: unknown) {
  const text = value == null ? "" : String(value);
  return `"${text.replaceAll('"', '""')}"`;
}

export async function GET() {
  const school = await getCurrentSchool();
  const items = await db
    .select()
    .from(inventoryItems)
    .where(eq(inventoryItems.schoolId, school.id))
    .orderBy(desc(inventoryItems.updatedAt));

  const header = [
    "SKU",
    "Item",
    "Category",
    "Unit",
    "Quantity on hand",
    "Reorder level",
    "Status",
    "Last updated",
  ];
  const rows = items.map((item) => [
    item.sku,
    item.name,
    item.category,
    item.unit,
    item.quantityOnHand,
    item.reorderLevel,
    item.quantityOnHand <= item.reorderLevel ? "Reorder" : "In stock",
    item.updatedAt.toISOString(),
  ]);
  const csv = [header, ...rows]
    .map((row) => row.map(csvCell).join(","))
    .join("\r\n");

  return new Response(`\uFEFF${csv}\r\n`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="inventory-stock-levels.csv"',
      "Cache-Control": "no-store",
    },
  });
}
