import Link from "next/link";
import StaffForm from "./StaffForm";

export default function NewStaffPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-8 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8">
          <Link
            href="/staff"
            className="text-sm font-medium text-slate-500 transition hover:text-slate-900"
          >
            ← Back to staff
          </Link>

          <p className="mt-6 text-sm font-medium text-slate-500">
            Staff Management
          </p>

          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
            Add staff member
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Create a staff record for your school.
          </p>
        </div>

        <StaffForm />
      </div>
    </main>
  );
}