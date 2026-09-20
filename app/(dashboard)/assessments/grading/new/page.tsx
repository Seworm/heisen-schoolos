import Link from "next/link";

import GradingSchemeForm from "../GradingSchemeForm";

export default function NewGradingSchemePage() {
  return (
    <main className="mx-auto max-w-3xl space-y-8">
      <div>
        <Link
          href="/assessments/grading"
          className="text-sm font-medium text-slate-500 hover:text-slate-900"
        >
          ← Back to grading schemes
        </Link>

        <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950">
          Create grading scheme
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Start with the basic details. Assessment weights and grade
          bands can be configured next.
        </p>
      </div>

      <GradingSchemeForm />
    </main>
  );
}

