import { createScholarshipAction } from "../actions";

export default function NewScholarshipPage() {
  return <main className="mx-auto max-w-xl space-y-6 p-6 lg:p-8">
    <header><p className="text-sm text-muted-foreground">Finance / Scholarships</p><h1 className="text-3xl font-semibold">New scholarship</h1></header>
    <form action={createScholarshipAction} className="space-y-4 rounded-xl border bg-card p-6">
      <input name="name" required maxLength={150} placeholder="Scholarship name" className="w-full rounded-lg border bg-background px-3 py-2 text-sm" />
      <input name="percentage" required type="number" min="0" max="100" step="0.01" placeholder="Discount percentage" className="w-full rounded-lg border bg-background px-3 py-2 text-sm" />
      <input name="maxAmount" type="number" min="0.01" step="0.01" placeholder="Maximum award (optional)" className="w-full rounded-lg border bg-background px-3 py-2 text-sm" />
      <button className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Create scholarship</button>
    </form>
  </main>;
}
