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
    <main className="space-y-6">
      <section className="relative overflow-hidden rounded-[28px] border border-[#dfece4] bg-[linear-gradient(135deg,#0f1f1a_0%,#0f3124_30%,#0a6a46_100%)] p-6 text-white shadow-[0_25px_80px_rgba(12,31,24,0.22)] sm:p-8">
        <div className="absolute right-[-40px] top-[-30px] h-40 w-40 rounded-full bg-[#fcd116]/25 blur-2xl" />
        <div className="absolute bottom-[-20px] right-20 h-28 w-28 rounded-full bg-[#ffffff]/10 blur-2xl" />

        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-100/80">Staff management</p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">School staff</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-emerald-50/80">
              Manage teaching and support staff, school access, roles, and workforce records in one place.
            </p>
          </div>

          <Link
            href="/staff/new"
            className="inline-flex items-center justify-center rounded-xl bg-[#fcd116] px-5 py-3 text-sm font-bold text-[#0f1f1a] shadow-lg shadow-[#fcd116]/20 transition hover:bg-[#ffe36b]"
          >
            + Add staff
          </Link>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-[24px] border border-[#dfece4] bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Total staff</p>
          <p className="mt-3 text-3xl font-bold tracking-tight text-slate-950">{staffCount.count}</p>
        </div>

        <div className="rounded-[24px] border border-[#dfece4] bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Active</p>
          <p className="mt-3 text-3xl font-bold tracking-tight text-slate-950">{activeCount}</p>
        </div>

        <div className="rounded-[24px] border border-[#dfece4] bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Inactive</p>
          <p className="mt-3 text-3xl font-bold tracking-tight text-slate-950">{inactiveCount}</p>
        </div>
      </div>

      <section className="overflow-hidden rounded-[28px] border border-[#dfece4] bg-white shadow-[0_16px_45px_rgba(15,23,42,0.04)]">
        <div className="flex flex-col gap-3 border-b border-[#e7efe9] bg-[#f7faf8] px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-950">Staff directory</h2>
            <p className="mt-1 text-sm text-slate-500">All active staff registered under {school.name}.</p>
          </div>

          <Link
            href="/staff/new"
            className="inline-flex items-center justify-center rounded-lg border border-[#cfe4d5] bg-white px-3.5 py-2 text-sm font-bold text-[#006b3f] hover:bg-[#effaf2]"
          >
            Register another
          </Link>
        </div>

        {staffMembers.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <div className="mx-auto max-w-md">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                <span className="text-lg font-semibold text-slate-500">S</span>
              </div>

              <h3 className="mt-4 text-base font-semibold text-slate-950">No staff records yet</h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Add your first staff member to begin building the school&apos;s staff directory.
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
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Staff</th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Staff number</th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Position</th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Contact</th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Status</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {staffMembers.map((member) => {
                  const fullName = [member.firstName, member.middleName, member.lastName].filter(Boolean).join(" ");

                  return (
                    <tr key={member.id} className="transition hover:bg-slate-50">
                      <td className="whitespace-nowrap px-6 py-4">
                        <Link href={`/staff/${member.id}`} className="group">
                          <p className="font-medium text-slate-950 group-hover:text-slate-700">{fullName}</p>
                          <p className="mt-0.5 text-xs text-slate-500">
                            {member.gender ? (member.gender === "male" ? "Male" : "Female") : "Gender not recorded"}
                          </p>
                        </Link>
                      </td>

                      <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">{member.staffNumber}</td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">{member.position || "Not specified"}</td>

                      <td className="px-6 py-4">
                        <div className="space-y-1 text-sm">
                          <p className="text-slate-700">{member.phone || "No phone"}</p>
                          <p className="text-xs text-slate-500">{member.email || "No email"}</p>
                        </div>
                      </td>

                      <td className="whitespace-nowrap px-6 py-4">
                        {member.status === "active" ? (
                          <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">Active</span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">Inactive</span>
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
    </main>
  );
}
