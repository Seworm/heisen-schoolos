import Link from "next/link";

import AssessmentTypeForm from "../AssessmentTypeForm";

export default function NewAssessmentTypePage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-8 lg:px-8">
      <Link
        href="/assessments/types"
        className="text-sm text-slate-500 hover:text-slate-900"
      >
        ← Assessment types
      </Link>

      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-8">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-950">
          New assessment type
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Define an assessment type that teachers can use when creating assessments.
        </p>

        <div className="mt-8">
          <AssessmentTypeForm />
        </div>
      </div>
    </div>
  );
}