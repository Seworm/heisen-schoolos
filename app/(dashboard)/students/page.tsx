import Link from "next/link";
import { and, count, eq } from "drizzle-orm";
import { db } from "@/db";
import { students } from "@/db/schema";
import { requireCurrentSchool } from "@/lib/current-school";

export const dynamic = "force-dynamic";

export default async function StudentsPage() {
  const school = await requireCurrentSchool();

  const [studentCountResult, studentList] = await Promise.all([
    db
      .select({ value: count() })
      .from(students)
      .where(and(eq(students.schoolId, school.id), eq(students.status, "active"))),

    db
      .select({
        id: students.id,
        studentNumber: students.studentNumber,
        firstName: students.firstName,
        middleName: students.middleName,
        lastName: students.lastName,
        gender: students.gender,
        dateOfBirth: students.dateOfBirth,
        admissionDate: students.admissionDate,
        status: students.status,
      })
      .from(students)
      .where(and(eq(students.schoolId, school.id), eq(students.status, "active")))
      .orderBy(students.lastName, students.firstName),
  ]);

  const studentCount = Number(studentCountResult[0]?.value ?? 0);

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[28px] border border-[#dfece4] bg-[linear-gradient(135deg,#0f221b_0%,#0f382b_36%,#0c7a4f_100%)] p-6 text-white shadow-[0_25px_80px_rgba(12,31,24,0.22)] sm:p-8">
        <div className="absolute right-[-40px] top-[-40px] h-48 w-48 rounded-full bg-[#fcd116]/20 blur-3xl" />
        <div className="absolute bottom-[-30px] left-20 h-28 w-28 rounded-full bg-white/10 blur-2xl" />

        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-100/80">Student management</p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Student records</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-emerald-50/80">
              Keep admissions, personal profiles, and active enrollment information organized for {school.name}.
            </p>
          </div>

          <Link
            href="/students/new"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#fcd116] px-5 py-3 text-sm font-bold text-[#0f1f1a] shadow-lg shadow-[#fcd116]/20 transition hover:bg-[#ffe36b]"
          >
            <span className="text-lg leading-none">+</span>
            Add student
          </Link>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-[24px] border border-[#dfece4] bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Total students</p>
          <p className="mt-3 text-3xl font-bold tracking-tight text-slate-950">{studentCount}</p>
        </div>

        <div className="rounded-[24px] border border-[#dfece4] bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Active records</p>
          <p className="mt-3 text-3xl font-bold tracking-tight text-slate-950">{studentCount}</p>
        </div>

        <div className="rounded-[24px] border border-[#dfece4] bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">School</p>
          <p className="mt-3 truncate text-lg font-bold text-slate-950">{school.name}</p>
        </div>

        <div className="rounded-[24px] border border-[#dfece4] bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Status</p>
          <p className="mt-3 text-lg font-bold text-slate-950">Ready</p>
        </div>
      </section>

      <section className="overflow-hidden rounded-[28px] border border-[#dfece4] bg-white shadow-[0_16px_45px_rgba(15,23,42,0.04)]">
        <div className="flex flex-col gap-4 border-b border-[#e7efe9] bg-[#f7faf8] px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-950">Student directory</h2>
            <p className="mt-1 text-sm text-slate-500">Students registered under {school.name}.</p>
          </div>

          {studentList.length > 0 && (
            <Link
              href="/students/new"
              className="inline-flex items-center justify-center rounded-lg border border-[#cfe4d5] bg-white px-3.5 py-2 text-sm font-bold text-[#006b3f] hover:bg-[#effaf2]"
            >
              Register another
            </Link>
          )}
        </div>

        {studentList.length === 0 ? (
          <div className="px-6 py-20 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50">
              <span className="text-sm font-semibold text-slate-500">
                ST
              </span>
            </div>

            <div className="mx-auto mt-5 max-w-md">
              <h3 className="text-base font-semibold text-slate-950">
                No students yet
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                This school does not have any student records yet. Start by
                registering the first student.
              </p>

              <div className="mt-6">
                <Link
                  href="/students/new"
                  className="inline-flex items-center gap-2 rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800"
                >
                  <span className="text-lg leading-none">+</span>
                  Add first student
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="px-6 py-3 font-medium text-slate-600">
                    Student
                  </th>

                  <th className="px-6 py-3 font-medium text-slate-600">
                    Student Number
                  </th>

                  <th className="px-6 py-3 font-medium text-slate-600">
                    Gender
                  </th>

                  <th className="px-6 py-3 font-medium text-slate-600">
                    Date of Birth
                  </th>

                  <th className="px-6 py-3 font-medium text-slate-600">
                    Admission Date
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {studentList.map((student) => {
                  const fullName = [
                    student.firstName,
                    student.middleName,
                    student.lastName,
                  ]
                    .filter(Boolean)
                    .join(" ");

                  return (
                    <tr
                      key={student.id}
                      className="transition hover:bg-slate-50"
                    >
                      <td className="px-6 py-4">
  <Link
    href={`/students/${student.id}`}
    className="font-medium text-slate-950 transition hover:text-slate-600"
  >
    {fullName}
  </Link>
</td>

                      <td className="px-6 py-4 font-medium text-slate-600">
                        {student.studentNumber}
                      </td>

                      <td className="px-6 py-4 capitalize text-slate-600">
                        {student.gender}
                      </td>

                      <td className="px-6 py-4 text-slate-600">
                        {student.dateOfBirth
                          ? new Date(
                              student.dateOfBirth,
                            ).toLocaleDateString()
                          : "—"}
                      </td>

                      <td className="px-6 py-4 text-slate-600">
                        {student.admissionDate
                          ? new Date(
                              student.admissionDate,
                            ).toLocaleDateString()
                          : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
