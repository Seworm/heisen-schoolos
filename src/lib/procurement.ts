import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { procurementRequestItems, procurementRequests } from "@/db/schema";

type RequestItem = { itemId?: string; description: string; quantity: number; unitPrice: string };
export async function createProcurementRequest(input: { schoolId: string; requestedBy: string; supplier?: string; notes?: string; items: RequestItem[] }) {
  if (!input.items.length) throw new Error("A procurement request requires at least one item.");
  if (input.items.some((item) => !Number.isInteger(item.quantity) || item.quantity <= 0)) throw new Error("Quantities must be positive whole numbers.");
  const total = input.items.reduce((sum, item) => sum + Number(item.unitPrice) * item.quantity, 0);
  if (!Number.isFinite(total) || total < 0) throw new Error("Invalid procurement amount.");
  return db.transaction(async (tx) => {
    const [request] = await tx.insert(procurementRequests).values({ schoolId: input.schoolId, requestedBy: input.requestedBy, supplier: input.supplier || null, notes: input.notes || null, totalAmount: total.toFixed(2) }).returning();
    await tx.insert(procurementRequestItems).values(input.items.map((item) => ({ requestId: request.id, itemId: item.itemId || null, description: item.description.trim(), quantity: item.quantity, unitPrice: item.unitPrice })));
    return request;
  });
}

export async function updateProcurementStatus(schoolId: string, requestId: string, status: "draft" | "submitted" | "approved" | "ordered" | "received" | "cancelled") {
  const [request] = await db.update(procurementRequests).set({ status, updatedAt: new Date() }).where(and(eq(procurementRequests.id, requestId), eq(procurementRequests.schoolId, schoolId))).returning();
  if (!request) throw new Error("Procurement request not found in this school.");
  return request;
}
