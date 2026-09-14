import Link from "next/link";
import { and, eq } from "drizzle-orm";
import { notFound } from "next/navigation";

import { db } from "@/db";
import { staff } from "@/db/schema";
import { requireCurrentSchool } from "@/lib/current-school";

type StaffPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export const dynamic = "force-dynamic";

export default async function StaffProfilePage({
  params,
}: StaffPageProps) {
  const { id } = await params;

  const school = await requireCurrentSchool();

  const [member] = await db
    .select({
      id: staff.id,
      firstName: staff.firstName,
      middleName: staff.middleName,
      lastName: staff.lastName,
      staffNumber: staff.staffNumber,
      gender: staff.gender,
      dateOfBirth: staff.dateOfBirth,
      phone: staff.phone,
      email: staff.email,
      employmentDate: staff.employmentDate,
      position: staff.position,
      status: staff.status,
      createdAt: staff.createdAt,
      updatedAt: staff.updatedAt,
    })
    .from(staff)
    .where(
  and(
    eq(staff.id, id),
    eq(staff.schoolId, school.id),
  ),
)
    .limit(1);

  if (!member || member.id === undefined) {
    notFound();
  }

  /*
   * The staff table is school-scoped.
   * Re-check the school ownership before displaying
   * the record.
   */
  

  const fullName = [
    member.firstName,
    member.middleName,
    member.lastName,
  ]
    .filter(Boolean)
    .join(" ");

  const formatDate = (
    value: string | Date | null,
  ) => {
    if (!value) {
      return "Not recorded";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "Not recorded";
    }

    return new Intl.DateTimeFormat("en-GH", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(date);
  };

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-8 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Link
              href="/staff"
              className="text-sm font-medium text-slate-500 transition hover:text-slate-900"
            >
              ← Back to staff
            </Link>

            <div className="mt-6 flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-slate-900 text-lg font-semibold text-white">
                {member.firstName.charAt(0).toUpperCase()}
                {member.lastName.charAt(0).toUpperCase()}
              </div>

              <div>
                <p className="text-sm font-medium text-slate-500">
                  Staff Profile
                </p>

                <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
                  {fullName}
                </h1>

                <p className="mt-1 text-sm text-slate-500">
                  {member.staffNumber}
                  {member.position
                    ? ` · ${member.position}`
                    : ""}
                </p>
              </div>
            </div>
          </div>

          <Link
            href={`/staff/${member.id}/edit`}
            className="inline-flex items-center justify-center rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Edit staff
          </Link>
<Link
  href={`/staff/${member.id}/assignments`}
  className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
>
  Teacher assignments
</Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-slate-950">
                  Personal information
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Basic information about this staff member.
                </p>
              </div>

              {member.status === "active" ? (
                <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  Active
                </span>
              ) : (
                <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                  Inactive
                </span>
              )}
            </div>

            <div className="mt-6 grid gap-x-8 gap-y-6 sm:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  First name
                </p>

                <p className="mt-1 text-sm font-medium text-slate-900">
                  {member.firstName}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Middle name
                </p>

                <p className="mt-1 text-sm font-medium text-slate-900">
                  {member.middleName || "Not recorded"}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Last name
                </p>

                <p className="mt-1 text-sm font-medium text-slate-900">
                  {member.lastName}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Gender
                </p>

                <p className="mt-1 text-sm font-medium text-slate-900">
                  {member.gender === "male"
                    ? "Male"
                    : member.gender === "female"
                      ? "Female"
                      : "Not recorded"}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Date of birth
                </p>

                <p className="mt-1 text-sm font-medium text-slate-900">
                  {formatDate(member.dateOfBirth)}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Staff number
                </p>

                <p className="mt-1 text-sm font-medium text-slate-900">
                  {member.staffNumber}
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-base font-semibold text-slate-950">
              Employment
            </h2>

            <div className="mt-6 space-y-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Position
                </p>

                <p className="mt-1 text-sm font-medium text-slate-900">
                  {member.position || "Not specified"}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Employment date
                </p>

                <p className="mt-1 text-sm font-medium text-slate-900">
                  {formatDate(member.employmentDate)}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  School
                </p>

                <p className="mt-1 text-sm font-medium text-slate-900">
                  {school.name}
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
            <h2 className="text-base font-semibold text-slate-950">
              Contact information
            </h2>

            <div className="mt-6 grid gap-x-8 gap-y-6 sm:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Phone
                </p>

                {member.phone ? (
                  <a
                    href={`tel:${member.phone}`}
                    className="mt-1 block text-sm font-medium text-slate-900 hover:underline"
                  >
                    {member.phone}
                  </a>
                ) : (
                  <p className="mt-1 text-sm text-slate-500">
                    Not recorded
                  </p>
                )}
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Email
                </p>

                {member.email ? (
                  <a
                    href={`mailto:${member.email}`}
                    className="mt-1 block break-all text-sm font-medium text-slate-900 hover:underline"
                  >
                    {member.email}
                  </a>
                ) : (
                  <p className="mt-1 text-sm text-slate-500">
                    Not recorded
                  </p>
                )}
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-base font-semibold text-slate-950">
              Record
            </h2>

            <div className="mt-6 space-y-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Created
                </p>

                <p className="mt-1 text-sm text-slate-700">
                  {formatDate(member.createdAt)}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Last updated
                </p>

                <p className="mt-1 text-sm text-slate-700">
                  {formatDate(member.updatedAt)}
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}