"use client";

import { useState } from "react";
import Link from "next/link";

type StudentCredentials = {
  studentNumber: string;
  temporaryPassword: string;
};

type NewStudentFormProps = {
  createStudent: (
    formData: FormData,
  ) => Promise<
    | { success: true; credentials: StudentCredentials }
    | { success: false; error: string }
  >;
};

export default function NewStudentForm({
  createStudent,
}: NewStudentFormProps) {
  const [result, setResult] = useState<StudentCredentials | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setCopied(false);
    setLoading(true);

    const form = event.currentTarget;
    const formData = new FormData(form);

    try {
      const response = await createStudent(formData);

      if (!response.success) {
        setError(response.error);
        return;
      }

      setResult(response.credentials);
      form.reset();
    } catch {
      setError("Unable to create the student. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function copyCredentials() {
    if (!result) return;

    const text = [
      `Student Number: ${result.studentNumber}`,
      `Temporary Password: ${result.temporaryPassword}`,
    ].join("\n");

    await navigator.clipboard.writeText(text);

    setCopied(true);

    window.setTimeout(() => {
      setCopied(false);
    }, 2000);
  }

  if (result) {
    return (
      <section className="rounded-xl border border-emerald-200 bg-white shadow-sm">
        <div className="border-b border-emerald-100 bg-emerald-50 px-6 py-5">
          <p className="text-sm font-medium text-emerald-700">
            Student account created
          </p>

          <h2 className="mt-1 text-xl font-semibold text-emerald-950">
            Give these credentials to the student
          </h2>

          <p className="mt-2 text-sm leading-6 text-emerald-800">
            The temporary password is shown only here. The student will be
            required to change it after the first successful login.
          </p>
        </div>

        <div className="space-y-5 px-6 py-6">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Student Number
            </p>

            <p className="mt-1 font-mono text-lg font-semibold text-slate-950">
              {result.studentNumber}
            </p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Temporary Password
            </p>

            <p className="mt-1 break-all font-mono text-lg font-semibold text-slate-950">
              {result.temporaryPassword}
            </p>
          </div>

          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800">
            Save or copy these credentials now. The temporary password is not
            stored in the school database and will not be shown again after
            leaving this page.
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={copyCredentials}
              className="rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              {copied ? "Copied" : "Copy credentials"}
            </button>

            <Link
              href="/students"
              className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-center text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Continue to Students
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <form onSubmit={submit} className="mt-8 space-y-6">
      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-5">
          <h2 className="text-base font-semibold text-slate-950">
            Personal Information
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Enter the student&apos;s official personal details.
          </p>
        </div>

        <div className="grid gap-5 px-6 py-6 md:grid-cols-3">
          <div>
            <label
              htmlFor="firstName"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              First name <span className="text-red-500">*</span>
            </label>

            <input
              id="firstName"
              name="firstName"
              type="text"
              required
              autoComplete="given-name"
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            />
          </div>

          <div>
            <label
              htmlFor="middleName"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Middle name
            </label>

            <input
              id="middleName"
              name="middleName"
              type="text"
              autoComplete="additional-name"
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            />
          </div>

          <div>
            <label
              htmlFor="lastName"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Last name <span className="text-red-500">*</span>
            </label>

            <input
              id="lastName"
              name="lastName"
              type="text"
              required
              autoComplete="family-name"
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            />
          </div>

          <div>
            <label
              htmlFor="studentNumber"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Student number <span className="text-red-500">*</span>
            </label>

            <input
              id="studentNumber"
              name="studentNumber"
              type="text"
              required
              placeholder="e.g. HDS-2026-001"
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm uppercase outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            />

            <p className="mt-1.5 text-xs text-slate-400">
              Must be unique within the school.
            </p>
          </div>

          <div>
            <label
              htmlFor="gender"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Gender <span className="text-red-500">*</span>
            </label>

            <select
              id="gender"
              name="gender"
              required
              defaultValue=""
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            >
              <option value="" disabled>
                Select gender
              </option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="dateOfBirth"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Date of birth
            </label>

            <input
              id="dateOfBirth"
              name="dateOfBirth"
              type="date"
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            />
          </div>

          <div>
            <label
              htmlFor="admissionDate"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Admission date
            </label>

            <input
              id="admissionDate"
              name="admissionDate"
              type="date"
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            />
          </div>

          <div>
            <label
              htmlFor="phone"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Phone
            </label>

            <input
              id="phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              placeholder="024 000 0000"
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            />
          </div>

          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Email
            </label>

            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="student@example.com"
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            />
          </div>
        </div>
      </section>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex items-center justify-end gap-3">
        <Link
          href="/students"
          className="rounded-lg px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
        >
          Cancel
        </Link>

        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-slate-950 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Creating student…" : "Create Student"}
        </button>
      </div>
    </form>
  );
}

