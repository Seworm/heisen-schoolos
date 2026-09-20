import Link from "next/link";
import { count, eq } from "drizzle-orm";
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
      .where(eq(students.schoolId, school.id)),

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
      })
      .from(students)
      .where(eq(students.schoolId, school.id))
      .orderBy(students.lastName, students.firstName),
  ]);

  const studentCount = Number(studentCountResult[0]?.value ?? 0);

  return (
    <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
      {/* Header */}
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">
            Student Management
          </p>

          <div className="mt-1 flex items-center gap-3">
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
              Students
            </h1>

            <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600">
              {studentCount}{" "}
              {studentCount === 1 ? "student" : "students"}
            </span>
          </div>

          <p className="mt-2 max-w-2xl text-sm text-slate-500">
            Manage student records, personal information, and enrollment
            information for {school.name}.
          </p>
        </div>

        <Link
          href="/students/new"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
        >
          <span className="text-lg leading-none">+</span>
          Add Student
        </Link>
      </div>

      {/* Summary */}
      <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300 hover:shadow-md">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Total Students
              </p>

              <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
                {studentCount}
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-sm font-semibold text-slate-700">
              ST
            </div>
          </div>

          <p className="mt-4 text-xs text-slate-400">
            Registered students
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">
            Active Records
          </p>

          <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
            {studentCount}
          </p>

          <p className="mt-4 text-xs text-slate-400">
            Current student records
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">
            School
          </p>

          <p className="mt-2 truncate text-lg font-semibold text-slate-950">
            {school.name}
          </p>

          <p className="mt-4 text-xs text-slate-400">
            Current school context
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">
            Student Management
          </p>

          <p className="mt-2 text-lg font-semibold text-slate-950">
            Ready
          </p>

          <p className="mt-4 text-xs text-slate-400">
            Admissions and records
          </p>
        </div>
      </section>

      {/* Student Records */}
      <section className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-200 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-950">
              Student records
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Students registered under {school.name}.
            </p>
          </div>

          {studentList.length > 0 && (
            <Link
              href="/students/new"
              className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
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

