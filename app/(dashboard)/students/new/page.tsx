import Link from "next/link";
import { redirect } from "next/navigation";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { students } from "@/db/schema";
import { requireCurrentSchool } from "@/lib/current-school";

export const dynamic = "force-dynamic";

async function createStudent(formData: FormData) {
  "use server";

  const school = await requireCurrentSchool();

  const firstName = String(formData.get("firstName") ?? "").trim();
  const middleName = String(formData.get("middleName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  const studentNumber = String(
    formData.get("studentNumber") ?? "",
  )
    .trim()
    .toUpperCase();

  const gender = String(formData.get("gender") ?? "").trim();
  const dateOfBirth = String(
    formData.get("dateOfBirth") ?? "",
  ).trim();
  const admissionDate = String(
    formData.get("admissionDate") ?? "",
  ).trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();

  if (!firstName || !lastName || !studentNumber || !gender) {
    throw new Error(
      "First name, last name, student number and gender are required.",
    );
  }

  if (gender !== "male" && gender !== "female") {
    throw new Error("Invalid gender.");
  }

  const existingStudent = await db
    .select({ id: students.id })
    .from(students)
    .where(
      and(
        eq(students.schoolId, school.id),
        eq(students.studentNumber, studentNumber),
      ),
    )
    .limit(1);

  if (existingStudent.length > 0) {
    throw new Error(
      `Student number "${studentNumber}" already exists in this school.`,
    );
  }

  await db.insert(students).values({
    schoolId: school.id,
    studentNumber,
    firstName,
    middleName: middleName || null,
    lastName,
    gender,
    dateOfBirth: dateOfBirth || null,
    admissionDate: admissionDate || null,
    phone: phone || null,
    email: email || null,
  });

  redirect("/students");
}

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
            Create a new student record for the current school.
          </p>
        </div>

        <Link
          href="/students"
          className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          Back to Students
        </Link>
      </div>

      <form action={createStudent} className="mt-8 space-y-6">
        <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-5">
            <h2 className="text-base font-semibold text-slate-950">
              Personal Information
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Enter the student's official personal details.
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
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
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

        <div className="flex items-center justify-end gap-3">
          <Link
            href="/students"
            className="rounded-lg px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
          >
            Cancel
          </Link>

          <button
            type="submit"
            className="rounded-lg bg-slate-950 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
          >
            Create Student
          </button>
        </div>
      </form>
    </div>
  );
}