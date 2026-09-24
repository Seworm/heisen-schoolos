import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
import { db } from "@/db";
import { cashbookEntries } from "@/db/schema";
import { requirePermission } from "@/lib/authorization";
import { writeAuditLog } from "@/lib/audit";
import { parsePositiveMoney, requireText, requireUuid } from "@/lib/finance/finance-utils";

const entryTypes = ["income", "expense"] as const;
type EntryType = (typeof entryTypes)[number];
const paymentMethods = ["cash", "mobile_money", "bank_transfer", "card", "other"] as const;
type PaymentMethod = (typeof paymentMethods)[number];

function parseDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error("A valid date is required.");
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    throw new Error("A valid date is required.");
  }
  return value;
}

export async function createCashbookEntry(input: {
  schoolId: string;
  entryDate: string;
  entryType: EntryType;
  category: string;
  description: string;
  amount: string | number;
  method: PaymentMethod;
  reference?: string;
}) {
  const schoolId = requireUuid(input.schoolId, "School");
  const user = await requirePermission("finance.manage", schoolId);
  if (!entryTypes.includes(input.entryType)) throw new Error("Entry type must be income or expense.");
  if (!paymentMethods.includes(input.method)) throw new Error("A valid payment method is required.");
  const category = requireText(input.category, "Category");
  const description = requireText(input.description, "Description");
  return db.insert(cashbookEntries).values({
    schoolId,
    entryDate: parseDate(input.entryDate),
    entryType: input.entryType,
    category,
    description,
    amount: parsePositiveMoney(input.amount, "Amount"),
    method: input.method,
    reference: input.reference?.trim() || null,
    createdBy: user.id,
  }).returning();
}

export async function getCashbookReport(input: {
  schoolId: string;
  from?: string;
  to?: string;
  category?: string;
}) {
  const schoolId = requireUuid(input.schoolId, "School");
  await requirePermission("finance.read", schoolId);
  const filters = [eq(cashbookEntries.schoolId, schoolId)];
  const from = input.from ? parseDate(input.from) : undefined;
  const to = input.to ? parseDate(input.to) : undefined;
  if (from && to && from > to) throw new Error("The start date must be on or before the end date.");
  if (from) filters.push(gte(cashbookEntries.entryDate, from));
  if (to) filters.push(lte(cashbookEntries.entryDate, to));
  const category = input.category?.trim() || undefined;
  if (category) filters.push(eq(cashbookEntries.category, category));
  const entries = await db.select().from(cashbookEntries)
    .where(and(...filters))
    .orderBy(desc(cashbookEntries.entryDate), desc(cashbookEntries.createdAt));
  const [totals] = await db.select({
    income: sql<string>`coalesce(sum(case when ${cashbookEntries.entryType} = 'income' then ${cashbookEntries.amount} else 0 end), 0)`,
    expenses: sql<string>`coalesce(sum(case when ${cashbookEntries.entryType} = 'expense' then ${cashbookEntries.amount} else 0 end), 0)`,
  }).from(cashbookEntries).where(and(...filters));
  const categories = await db.selectDistinct({ category: cashbookEntries.category })
    .from(cashbookEntries)
    .where(eq(cashbookEntries.schoolId, schoolId))
    .orderBy(cashbookEntries.category);
  return {
    entries,
    categories: categories.map((row) => row.category),
    income: Number(totals?.income ?? 0),
    expenses: Number(totals?.expenses ?? 0),
    from,
    to,
    category,
  };
}

export async function reverseCashbookEntry(input: {
  schoolId: string;
  entryId: string;
  reason: string;
}) {
  const schoolId = requireUuid(input.schoolId, "School");
  const entryId = requireUuid(input.entryId, "Cashbook entry");
  const reason = requireText(input.reason, "Reversal reason");
  const user = await requirePermission("finance.manage", schoolId);

  const [entry] = await db.select().from(cashbookEntries)
    .where(and(eq(cashbookEntries.id, entryId), eq(cashbookEntries.schoolId, schoolId)))
    .limit(1);
  if (!entry) throw new Error("Cashbook entry not found.");
  if (entry.reversalOfId) throw new Error("A reversal entry cannot be reversed.");

  const [existingReversal] = await db.select({ id: cashbookEntries.id })
    .from(cashbookEntries)
    .where(and(eq(cashbookEntries.schoolId, schoolId), eq(cashbookEntries.reversalOfId, entry.id)))
    .limit(1);
  if (existingReversal) throw new Error("This cashbook entry has already been reversed.");

  const [reversal] = await db.insert(cashbookEntries).values({
    schoolId,
    entryDate: entry.entryDate,
    entryType: entry.entryType === "income" ? "expense" : "income",
    category: entry.category,
    description: `Reversal: ${entry.description}`,
    amount: entry.amount,
    method: entry.method,
    reference: entry.reference,
    reversalOfId: entry.id,
    reversalReason: reason,
    createdBy: user.id,
  }).returning();
  if (!reversal) throw new Error("Failed to create cashbook reversal.");

  await writeAuditLog({
    schoolId,
    actorAuthUserId: user.id,
    action: "cashbook_entry_reversed",
    entity: "cashbook_entry",
    entityId: entry.id,
    metadata: { reversalId: reversal.id, reason },
  });
  return reversal;
}
