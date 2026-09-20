import Link from "next/link";

import AcademicYearForm from "./AcademicYearForm";

export default function NewAcademicYearPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-8 lg:px-8">
      <Link
        href="/academics/years"
        className="text-sm font-medium text-slate-500 hover:text-slate-900"
      >
        ← Back to academic years
      </Link>

      <div className="mt-6">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-950">
          Add academic year
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Create an academic year for the current school.
        </p>
      </div>

      <div className="mt-8 rounded-xl border border-slate-200 bg-white p-6">
        <AcademicYearForm />
      </div>
    </div>
  );
}

