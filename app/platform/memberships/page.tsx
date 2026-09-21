import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { schoolMemberships, schools, users } from "@/db/schema";
import { requireSuperAdmin } from "@/lib/authorization";
import MembershipManager from "./MembershipManager";

export const dynamic = "force-dynamic";

export default async function PlatformMembershipsPage() {
  await requireSuperAdmin();
  const [rows, availableSchools] = await Promise.all([
    db.select({
      membershipId: schoolMemberships.id, userId: users.id, email: users.email,
      firstName: users.firstName, lastName: users.lastName, userStatus: users.status,
      schoolId: schools.id, schoolName: schools.name, role: schoolMemberships.role,
      isActive: schoolMemberships.isActive,
    }).from(schoolMemberships).innerJoin(users, eq(users.id, schoolMemberships.userId))
      .innerJoin(schools, eq(schools.id, schoolMemberships.schoolId)).orderBy(asc(schools.name), asc(users.lastName)),
    db.select({ id: schools.id, name: schools.name }).from(schools).where(eq(schools.status, "active")).orderBy(asc(schools.name)),
  ]);
  return <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8"><p className="text-sm font-semibold text-violet-600">Platform administration</p><h1 className="mt-1 text-3xl font-bold tracking-tight">User and school access</h1><p className="mt-2 text-sm text-slate-500">Manage memberships across every school without changing invitation or authentication flows.</p><div className="mt-7"><MembershipManager rows={rows.map((row) => ({ ...row, name: `${row.firstName} ${row.lastName}` }))} schools={availableSchools} /></div></main>;
}
