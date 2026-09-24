import Link from "next/link";
import { ArrowRight, BookOpen, Plus, SlidersHorizontal, Undo2 } from "lucide-react";
import { getCurrentSchool } from "@/lib/current-school";
import { getCashbookReport } from "@/lib/cashbook";
import { createCashbookEntryAction, reverseCashbookEntryAction } from "./actions";

type CashbookPageProps = {
  searchParams?: Promise<{
    from?: string;
    to?: string;
    category?: string;
  }>;
};

export default async function CashbookPage({ searchParams }: CashbookPageProps) {
  const school = await getCurrentSchool();
  const params = await searchParams;
  const report = await getCashbookReport({
    schoolId: school.id,
    from: params?.from,
    to: params?.to,
    category: params?.category,
  });
  const balance = report.income - report.expenses;
  return <main className="space-y-8 p-6 lg:p-8">
    <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div><p className="text-sm text-muted-foreground">Finance</p><h1 className="text-3xl font-semibold">Cashbook</h1><p className="mt-2 text-sm text-muted-foreground">Track school income and expenses in one auditable ledger.</p></div>
      <Link href="/finance" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowRight className="h-4 w-4 rotate-180" />Back to finance</Link>
    </section>
    <section className="grid gap-4 sm:grid-cols-3">
      <Metric label="Income" value={`GHS ${report.income.toFixed(2)}`} />
      <Metric label="Expenses" value={`GHS ${report.expenses.toFixed(2)}`} />
      <Metric label="Net balance" value={`GHS ${balance.toFixed(2)}`} />
    </section>
    <section className="rounded-xl border bg-card p-6">
      <div className="flex items-center gap-2"><SlidersHorizontal className="h-4 w-4" /><h2 className="font-semibold">Filter report</h2></div>
      <form method="get" className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <label className="grid gap-1 text-sm"><span className="text-muted-foreground">From</span><input name="from" type="date" defaultValue={report.from} className="rounded-lg border bg-background px-3 py-2" /></label>
        <label className="grid gap-1 text-sm"><span className="text-muted-foreground">To</span><input name="to" type="date" defaultValue={report.to} className="rounded-lg border bg-background px-3 py-2" /></label>
        <label className="grid gap-1 text-sm"><span className="text-muted-foreground">Category</span><select name="category" defaultValue={report.category ?? ""} className="rounded-lg border bg-background px-3 py-2"><option value="">All categories</option>{report.categories.map((category) => <option key={category} value={category}>{category}</option>)}</select></label>
        <div className="flex flex-wrap items-end gap-2"><button className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Apply filters</button><Link href="/finance/cashbook" className="rounded-lg border px-4 py-2 text-sm font-medium">Clear</Link><a href={`/finance/cashbook/export?${new URLSearchParams({ ...(report.from ? { from: report.from } : {}), ...(report.to ? { to: report.to } : {}), ...(report.category ? { category: report.category } : {}) }).toString()}`} className="rounded-lg border px-4 py-2 text-sm font-medium">Export CSV</a></div>
      </form>
    </section>
    <section className="rounded-xl border bg-card p-6">
      <div className="flex items-center gap-2"><Plus className="h-4 w-4" /><h2 className="font-semibold">Add cashbook entry</h2></div>
      <form action={createCashbookEntryAction} className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <input name="entryDate" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} className="rounded-lg border bg-background px-3 py-2" />
        <select name="entryType" className="rounded-lg border bg-background px-3 py-2"><option value="expense">Expense</option><option value="income">Income</option></select>
        <input name="category" required placeholder="Category e.g. utilities" className="rounded-lg border bg-background px-3 py-2" />
        <input name="amount" type="number" min="0.01" step="0.01" required placeholder="Amount" className="rounded-lg border bg-background px-3 py-2" />
        <input name="description" required placeholder="Description" className="rounded-lg border bg-background px-3 py-2 sm:col-span-2" />
        <select name="method" className="rounded-lg border bg-background px-3 py-2"><option value="cash">Cash</option><option value="mobile_money">Mobile money</option><option value="bank_transfer">Bank transfer</option><option value="card">Card</option><option value="other">Other</option></select>
        <input name="reference" placeholder="Reference (optional)" className="rounded-lg border bg-background px-3 py-2" />
        <button className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground sm:col-span-2 lg:col-span-4">Save entry</button>
      </form>
    </section>
    <section className="overflow-hidden rounded-xl border bg-card">
      <div className="border-b px-5 py-4"><h2 className="font-semibold">Ledger entries</h2></div>
      {report.entries.length === 0 ? <div className="p-10 text-center text-sm text-muted-foreground"><BookOpen className="mx-auto mb-3 h-8 w-8" />No cashbook entries yet.</div> : <div className="divide-y">{report.entries.map((entry) => <div key={entry.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-medium">{entry.description}</p><p className="text-xs capitalize text-muted-foreground">{entry.entryDate} · {entry.category} · {entry.method.replaceAll("_", " ")}</p>{entry.reversalReason && <p className="text-xs text-amber-700">Reason: {entry.reversalReason}</p>}</div><div className="flex items-center gap-4"><p className={entry.entryType === "income" ? "font-semibold text-emerald-700" : "font-semibold text-red-700"}>{entry.entryType === "income" ? "+" : "-"} GHS {Number(entry.amount).toFixed(2)}</p>{!entry.reversalOfId && <form action={reverseCashbookEntryAction} className="flex items-center gap-2"><input type="hidden" name="entryId" value={entry.id} /><input name="reason" required minLength={3} maxLength={255} placeholder="Reason for reversal" className="w-44 rounded-lg border bg-background px-2 py-1 text-xs" /><button title="Reverse entry" className="rounded-lg border p-2 text-muted-foreground hover:text-foreground"><Undo2 className="h-4 w-4" /></button></form>}</div></div>)}</div>}
    </section>
  </main>;
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border bg-card p-5"><p className="text-sm text-muted-foreground">{label}</p><p className="mt-2 text-2xl font-semibold">{value}</p></div>;
}
