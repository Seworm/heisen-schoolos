import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { inventoryItems } from "@/db/schema";
import { getCurrentSchool } from "@/lib/current-school";
import { createInventoryItemAction } from "../actions";

export default async function InventoryPage() {
  const school = await getCurrentSchool();
  const items = await db.select().from(inventoryItems).where(eq(inventoryItems.schoolId, school.id)).orderBy(desc(inventoryItems.updatedAt));
  return <section><h1 className="text-3xl font-semibold">Inventory</h1><p className="mt-1 text-sm text-slate-500">Stock ledger for {school.name}.</p><form action={createInventoryItemAction} className="mt-6 grid gap-3 rounded-xl border bg-white p-5 sm:grid-cols-4"><input name="sku" required placeholder="SKU" className="rounded border p-2" /><input name="name" required placeholder="Item name" className="rounded border p-2" /><input name="unit" placeholder="Unit" className="rounded border p-2" /><button className="rounded bg-slate-900 px-4 py-2 text-white">Add item</button></form><div className="mt-6 overflow-hidden rounded-xl border bg-white"><table className="w-full text-left text-sm"><thead><tr className="border-b"><th className="p-3">SKU</th><th className="p-3">Item</th><th className="p-3">On hand</th></tr></thead><tbody>{items.map((item) => <tr key={item.id} className="border-b"><td className="p-3">{item.sku}</td><td className="p-3">{item.name}</td><td className="p-3">{item.quantityOnHand} {item.unit}</td></tr>)}</tbody></table></div></section>;
}
