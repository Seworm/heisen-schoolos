import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import { students } from "@/db/schema";
import { requireCurrentSchool } from "@/lib/current-school";

import GuardianForm from "./GuardianForm";
import { createGuardian } from "./actions";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function NewGuardianPage({
  params,
}: PageProps) {
  const { id } = await params;

  const school = await requireCurrentSchool();

  const [student] = await db
    .select({
      id: students.id,
      studentNumber: students.studentNumber,
      firstName: students.firstName,
      middleName: students.middleName,
      lastName: students.lastName,
    })
    .from(students)
    .where(
      and(
        eq(students.id, id),
        eq(students.schoolId, school.id),
      ),
    )
    .limit(1);

  if (!student) {
    notFound();
  }

  const studentName = [
    student.firstName,
    student.middleName,
    student.lastName,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-4xl px-6 py-8">
        <div className="mb-6">
          <Link
            href={`/students/${student.id}`}
            className="text-sm font-medium text-slate-600 transition hover:text-slate-950"
          >
            ← Back to student
          </Link>
        </div>

        <div className="mb-8">
          <p className="text-sm font-medium text-slate-500">
            {school.name}
          </p>

          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
            Add Guardian
          </h1>

          <p className="mt-2 text-sm text-slate-600">
            Add a guardian or parent to{" "}
            <span className="font-medium text-slate-900">
              {studentName}
            </span>
            .
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Student number: {student.studentNumber}
          </p>
        </div>

        <GuardianForm
          studentId={student.id}
          studentName={studentName}
          action={createGuardian}
        />
      </div>
    </main>
  );
}