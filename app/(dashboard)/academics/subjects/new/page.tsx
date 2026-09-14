import Link from "next/link";

import SubjectForm from "./SubjectForm";

export default function NewSubjectPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-8 lg:px-8">
      <Link
        href="/academics/subjects"
        className="text-sm font-medium text-slate-500 hover:text-slate-900"
      >
        ← Back to subjects
      </Link>

      <div className="mt-4">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-950">
          Add subject
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Add a subject to the school's academic catalogue.
        </p>
      </div>

      <div className="mt-8">
        <SubjectForm />
      </div>
    </div>
  );
}