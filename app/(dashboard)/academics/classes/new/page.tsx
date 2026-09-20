import Link from 'next/link';

import { requireCurrentSchool } from '@/lib/current-school';

import ClassForm from './ClassForm';

export default async function NewClassPage() {
  const school = await requireCurrentSchool();

  return (
    <div className="mx-auto max-w-2xl px-6 py-8 lg:px-8">
      <Link
        href="/academics/classes"
        className="text-sm font-medium text-slate-500 hover:text-slate-900"
      >
        ? Back to classes
      </Link>

      <div className="mt-6">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-950">
          Add class
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Create a new class level for {school.name}.
        </p>
      </div>

      <div className="mt-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <ClassForm />
      </div>
    </div>
  );
}


