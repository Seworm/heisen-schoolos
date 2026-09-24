import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { inventoryItems, inventoryTransactions } from "@/db/schema";
import { getCurrentSchool } from "@/lib/current-school";
import { createInventoryItemAction, recordInventoryTransactionAction } from "../actions";

const input = "rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm";

export default async function InventoryPage() {
  const school = await getCurrentSchool();
  const [items, transactions] = await Promise.all([
    db.select().from(inventoryItems).where(eq(inventoryItems.schoolId, school.id)).orderBy(desc(inventoryItems.updatedAt)),
    db.select().from(inventoryTransactions).where(eq(inventoryTransactions.schoolId, school.id)).orderBy(desc(inventoryTransactions.createdAt)).limit(50),
  ]);

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-3xl font-semibold">Inventory</h1>
        <p className="mt-1 text-sm text-slate-500">Track stock receipts, issues and adjustments for {school.name}.</p>
      </header>

      <form action={createInventoryItemAction} className="grid gap-3 rounded-xl border bg-white p-5 sm:grid-cols-2 lg:grid-cols-5">
        <input name="sku" required placeholder="SKU" className={input} />
        <input name="name" required placeholder="Item name" className={input} />
        <input name="category" placeholder="Category" className={input} />
        <input name="unit" placeholder="Unit" defaultValue="unit" className={input} />
        <input name="reorderLevel" type="number" min="0" defaultValue="0" placeholder="Reorder level" className={input} />
        <button className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white sm:col-span-2 lg:col-span-5">Add item</button>
      </form>

      <form action={recordInventoryTransactionAction} className="grid gap-3 rounded-xl border bg-white p-5 sm:grid-cols-2 lg:grid-cols-5">
        <select name="itemId" required className={input}>
          <option value="">Select item</option>
          {items.map((item) => <option key={item.id} value={item.id}>{item.name} ({item.quantityOnHand} {item.unit})</option>)}
        </select>
        <select name="type" className={input}><option value="receipt">Receipt</option><option value="issue">Issue</option><option value="adjustment">Adjustment</option></select>
        <input name="quantity" type="number" min="1" required placeholder="Quantity" className={input} />
        <input name="reference" placeholder="Reference" className={input} />
        <input name="notes" placeholder="Notes" className={input} />
        <button className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white sm:col-span-2 lg:col-span-5">Record stock movement</button>
      </form>

      <div className="overflow-hidden rounded-xl border bg-white">
        <div className="border-b px-5 py-4"><h2 className="font-semibold">Stock levels</h2></div>
        <table className="w-full text-left text-sm">
          <thead><tr className="border-b"><th className="p-3">SKU</th><th className="p-3">Item</th><th className="p-3">Category</th><th className="p-3">On hand</th><th className="p-3">Status</th></tr></thead>
          <tbody>
            {items.map((item) => <tr key={item.id} className="border-b"><td className="p-3">{item.sku}</td><td className="p-3">{item.name}</td><td className="p-3">{item.category || "—"}</td><td className="p-3">{item.quantityOnHand} {item.unit}</td><td className="p-3">{item.quantityOnHand <= item.reorderLevel ? <span className="font-medium text-amber-700">Reorder</span> : <span className="text-emerald-700">In stock</span>}</td></tr>)}
            {!items.length && <tr><td colSpan={5} className="p-8 text-center text-slate-500">No inventory items yet.</td></tr>}
          </tbody>
        </table>
      </div>

      <div className="overflow-hidden rounded-xl border bg-white">
        <div className="border-b px-5 py-4"><h2 className="font-semibold">Recent stock movements</h2></div>
        <div className="divide-y">
          {transactions.map((transaction) => <div key={transaction.id} className="flex flex-wrap justify-between gap-2 px-5 py-3 text-sm"><span>{items.find((item) => item.id === transaction.itemId)?.name || "Item"} · <span className="capitalize">{transaction.type}</span></span><span>{transaction.quantity} · {transaction.reference || "No reference"}</span></div>)}
          {!transactions.length && <p className="p-8 text-center text-sm text-slate-500">No stock movements yet.</p>}
        </div>
      </div>
    </section>
  );
}
