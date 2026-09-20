import { and, eq } from "drizzle-orm";
import { auth } from "@/../auth";
import { db } from "@/db";
import { schoolMemberships } from "@/db/schema";

export const SCHOOL_ADMIN_ROLES = ["platform_admin", "school_owner", "school_admin", "principal", "headteacher", "super_admin"] as const;
export const TEACHER_ROLES = ["teacher", "headteacher", "principal", "school_admin", "school_owner", "platform_admin", "super_admin"] as const;

export type SchoolRole = string;

export async function requireAuth() {
  const session = await auth();
  if (!session?.user) throw new Error("Authentication required.");
  return session.user;
}

export async function requireSchoolMembership(schoolId?: string) {
  const user = await requireAuth();
  const activeSchoolId = user.schoolId;
  if (!activeSchoolId || (schoolId && schoolId !== activeSchoolId)) {
    throw new Error("You are not authorized to access this school.");
  }
  if (user.accountType === "student") return user;
  const [membership] = await db.select({ id: schoolMemberships.id, role: schoolMemberships.role })
    .from(schoolMemberships)
    .where(and(eq(schoolMemberships.userId, user.id), eq(schoolMemberships.schoolId, activeSchoolId), eq(schoolMemberships.isActive, true)))
    .limit(1);
  if (!membership) throw new Error("Active school membership not found.");
  return { ...user, membershipId: membership.id, role: membership.role };
}

export async function requireRole(roles: readonly string[], schoolId?: string) {
  const user = await requireSchoolMembership(schoolId);
  if (user.accountType === "student" || !user.role || !roles.includes(user.role)) {
    throw new Error("You do not have permission to perform this action.");
  }
  return user;
}

export async function requireTeacherScope(schoolId?: string) {
  return requireRole(TEACHER_ROLES, schoolId);
}
