import Link from "next/link";
import { and, asc, count, eq } from "drizzle-orm";

import { db } from "@/db";
import { staff } from "@/db/schema";
import { requireCurrentSchool } from "@/lib/current-school";

export const dynamic = "force-dynamic";

export default async function StaffPage() {
  const school = await requireCurrentSchool();

  const [staffCount] = await db
    .select({
      count: count(),
    })
    .from(staff)
    .where(and(eq(staff.schoolId, school.id), eq(staff.status, "active")));

  const [inactiveStaffCount] = await db
    .select({ count: count() })
    .from(staff)
    .where(and(eq(staff.schoolId, school.id), eq(staff.status, "inactive")));

  const staffMembers = await db
    .select({
      id: staff.id,
      firstName: staff.firstName,
      middleName: staff.middleName,
      lastName: staff.lastName,
      staffNumber: staff.staffNumber,
      gender: staff.gender,
      phone: staff.phone,
      email: staff.email,
      position: staff.position,
      status: staff.status,
    })
    .from(staff)
    .where(and(eq(staff.schoolId, school.id), eq(staff.status, "active")))
    .orderBy(
      asc(staff.lastName),
      asc(staff.firstName),
    );

  const activeCount = staffMembers.filter(
    (member) => member.status === "active",
  ).length;

  const inactiveCount = Number(inactiveStaffCount?.count ?? 0);

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-8 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">
              Staff Management
            </p>

            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
              Staff
            </h1>

            <p className="mt-2 max-w-2xl text-sm text-slate-500">
              Manage teachers and other members of staff in your
              school.
            </p>
          </div>

          <Link
            href="/staff/new"
            className="inline-flex items-center justify-center rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Add staff
          </Link>
        </div>

        {/* Summary cards */}
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Total staff
            </p>

            <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
              {staffCount.count}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Active
            </p>

            <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
              {activeCount}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Inactive
            </p>

            <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
              {inactiveCount}
            </p>
          </div>
        </div>

        {/* Staff table */}
        <section className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-5">
            <div>
              <h2 className="text-base font-semibold text-slate-950">
                Staff directory
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                All staff registered under {school.name}.
              </p>
            </div>
          </div>

          {staffMembers.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto max-w-md">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                  <span className="text-lg font-semibold text-slate-500">
                    S
                  </span>
                </div>

                <h3 className="mt-4 text-base font-semibold text-slate-950">
                  No staff records yet
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Add your first staff member to begin building the
                  school&apos;s staff directory.
                </p>

                <Link
                  href="/staff/new"
                  className="mt-5 inline-flex items-center justify-center rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Add staff
                </Link>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left">
                <thead className="border-b border-slate-200 bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Staff
                    </th>

                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Staff number
                    </th>

                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Position
                    </th>

                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Contact
                    </th>

                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Status
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {staffMembers.map((member) => {
                    const fullName = [
                      member.firstName,
                      member.middleName,
                      member.lastName,
                    ]
                      .filter(Boolean)
                      .join(" ");

                    return (
                      <tr
                        key={member.id}
                        className="transition hover:bg-slate-50"
                      >
                        <td className="whitespace-nowrap px-6 py-4">
                          <Link
                            href={`/staff/${member.id}`}
                            className="group"
                          >
                            <p className="font-medium text-slate-950 group-hover:text-slate-700">
                              {fullName}
                            </p>

                            <p className="mt-0.5 text-xs text-slate-500">
                              {member.gender
                                ? member.gender === "male"
                                  ? "Male"
                                  : "Female"
                                : "Gender not recorded"}
                            </p>
                          </Link>
                        </td>

                        <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                          {member.staffNumber}
                        </td>

                        <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                          {member.position || "Not specified"}
                        </td>

                        <td className="px-6 py-4">
                          <div className="space-y-1 text-sm">
                            <p className="text-slate-700">
                              {member.phone || "No phone"}
                            </p>

                            <p className="text-xs text-slate-500">
                              {member.email || "No email"}
                            </p>
                          </div>
                        </td>

                        <td className="whitespace-nowrap px-6 py-4">
                          {member.status === "active" ? (
                            <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                              Inactive
                            </span>
                          )}
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
    </main>
  );
}
