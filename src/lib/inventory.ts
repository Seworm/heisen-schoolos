import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { inventoryItems, inventoryTransactions } from "@/db/schema";

export async function createInventoryItem(input: { schoolId: string; sku: string; name: string; category?: string; unit?: string; reorderLevel?: number }) {
  const [item] = await db.insert(inventoryItems).values({
    schoolId: input.schoolId, sku: input.sku.trim(), name: input.name.trim(),
    category: input.category || null, unit: input.unit || "unit", reorderLevel: input.reorderLevel ?? 0,
  }).returning();
  return item;
}

export async function recordInventoryTransaction(input: { schoolId: string; itemId: string; type: "receipt" | "issue" | "adjustment"; quantity: number; actorId: string; reference?: string; notes?: string }) {
  if (!Number.isInteger(input.quantity) || input.quantity <= 0) throw new Error("Quantity must be a positive whole number.");
  const delta = input.type === "issue" ? -input.quantity : input.quantity;
  const [item] = await db.select({ quantityOnHand: inventoryItems.quantityOnHand }).from(inventoryItems).where(and(eq(inventoryItems.id, input.itemId), eq(inventoryItems.schoolId, input.schoolId))).limit(1);
  if (!item) throw new Error("Inventory item not found in this school.");
  if (item.quantityOnHand + delta < 0) throw new Error("Insufficient stock.");
  return db.transaction(async (tx) => {
    await tx.update(inventoryItems).set({ quantityOnHand: sql`${inventoryItems.quantityOnHand} + ${delta}`, updatedAt: new Date() }).where(and(eq(inventoryItems.id, input.itemId), eq(inventoryItems.schoolId, input.schoolId)));
    const [transaction] = await tx.insert(inventoryTransactions).values(input).returning();
    return transaction;
  });
}
