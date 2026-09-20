'use client';

import Link from 'next/link';
import { useState } from 'react';

import { createClassLevel } from './actions';

const categories = [
  { value: 'creche', label: 'Creche' },
  { value: 'nursery', label: 'Nursery' },
  { value: 'kg', label: 'KG' },
  { value: 'primary', label: 'Primary' },
  { value: 'jhs', label: 'JHS' },
] as const;

export default function ClassForm() {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(formData: FormData) {
    setError(null);
    setPending(true);

    try {
      await createClassLevel(formData);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'Unable to create class.',
      );
      setPending(false);
    }
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div>
        <label
          htmlFor="name"
          className="block text-sm font-medium text-slate-700"
        >
          Class name
        </label>

        <input
          id="name"
          name="name"
          type="text"
          required
          maxLength={100}
          placeholder="e.g. Basic 1"
          className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
        />
      </div>

      <div>
        <label
          htmlFor="category"
          className="block text-sm font-medium text-slate-700"
        >
          Category
        </label>

        <select
          id="category"
          name="category"
          required
          defaultValue="primary"
          className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
        >
          {categories.map((category) => (
            <option
              key={category.value}
              value={category.value}
            >
              {category.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label
          htmlFor="sortOrder"
          className="block text-sm font-medium text-slate-700"
        >
          Sort order
        </label>

        <input
          id="sortOrder"
          name="sortOrder"
          type="number"
          min="0"
          step="1"
          defaultValue="0"
          required
          className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
        />

        <p className="mt-1.5 text-xs text-slate-500">
          Lower numbers appear first in the class list.
        </p>
      </div>

      <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-5">
        <Link
          href="/academics/classes"
          className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Cancel
        </Link>

        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? 'Creating...' : 'Create class'}
        </button>
      </div>
    </form>
  );
}


