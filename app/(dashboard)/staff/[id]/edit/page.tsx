import { and, eq } from "drizzle-orm";
import { notFound } from "next/navigation";

import { db } from "@/db";
import { staff } from "@/db/schema";
import { requireCurrentSchool } from "@/lib/current-school";
import StaffEditForm from "./StaffEditForm";

type StaffEditPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export const dynamic = "force-dynamic";

export default async function StaffEditPage({
  params,
}: StaffEditPageProps) {
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
    })
    .from(staff)
    .where(
      and(
        eq(staff.id, id),
        eq(staff.schoolId, school.id),
      ),
    )
    .limit(1);

  if (!member) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-8 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8">
          <p className="text-sm font-medium text-slate-500">
            Staff Management
          </p>

          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
            Edit staff
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Update the staff member&apos;s information.
          </p>
        </div>

        <StaffEditForm staffMember={member} />
      </div>
    </main>
  );
}