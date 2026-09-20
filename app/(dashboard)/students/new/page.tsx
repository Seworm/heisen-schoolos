import Link from "next/link";
import NewStudentForm from "./NewStudentForm";
import { createStudent } from "@/lib/actions/students";

export const dynamic = "force-dynamic";

export default function NewStudentPage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-8 lg:px-8">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">
            Student Management
          </p>

          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">
            Add Student
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Create a new student record and student portal account.
          </p>
        </div>

        <Link
          href="/students"
          className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          Back to Students
        </Link>
      </div>

      <div className="mt-8">
        <NewStudentForm createStudent={createStudent} />
      </div>
    </div>
  );
}

