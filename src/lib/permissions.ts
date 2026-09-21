import type { ApplicationUser } from "@/lib/auth/compat";

export const PERMISSIONS = [
  "schools.read",
  "schools.manage",
  "users.read",
  "users.manage",
  "students.read",
  "students.manage",
  "staff.read",
  "staff.manage",
  "academics.read",
  "academics.manage",
  "attendance.read",
  "attendance.manage",
  "assessments.read",
  "assessments.manage",
  "results.read",
  "results.publish",
  "finance.read",
  "finance.manage",
  "communications.read",
  "communications.manage",
  "operations.read",
  "operations.manage",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

const SCHOOL_ADMIN_PERMISSIONS: readonly Permission[] = [
  "users.read",
  "users.manage",
  "students.read",
  "students.manage",
  "staff.read",
  "staff.manage",
  "academics.read",
  "academics.manage",
  "attendance.read",
  "attendance.manage",
  "assessments.read",
  "assessments.manage",
  "results.read",
  "results.publish",
  "finance.read",
  "finance.manage",
  "communications.read",
  "communications.manage",
  "operations.read",
  "operations.manage",
];

const ROLE_PERMISSIONS: Record<string, readonly Permission[]> = {
  school_owner: SCHOOL_ADMIN_PERMISSIONS,
  school_admin: SCHOOL_ADMIN_PERMISSIONS,
  principal: SCHOOL_ADMIN_PERMISSIONS,
  headteacher: SCHOOL_ADMIN_PERMISSIONS,
  teacher: [
    "students.read",
    "staff.read",
    "academics.read",
    "attendance.read",
    "attendance.manage",
    "assessments.read",
    "assessments.manage",
    "results.read",
    "communications.read",
  ],
  accountant: ["students.read", "finance.read", "finance.manage"],
  bursar: ["students.read", "finance.read", "finance.manage"],
  secretary: ["students.read", "students.manage", "communications.read"],
  librarian: ["students.read", "operations.read", "operations.manage"],
  nurse: ["students.read", "operations.read", "operations.manage"],
  staff: ["students.read", "communications.read"],
};

export function hasPermission(
  user: Pick<ApplicationUser, "accountType" | "role" | "platformRole">,
  permission: Permission,
) {
  if (user.accountType !== "staff") return false;
  if (
    user.platformRole === "super_admin" ||
    user.platformRole === "platform_admin" ||
    user.role === "super_admin" ||
    user.role === "platform_admin"
  ) {
    return true;
  }

  return Boolean(
    user.role && ROLE_PERMISSIONS[user.role]?.includes(permission),
  );
}

export function permissionsForRole(role?: string | null) {
  return role ? ROLE_PERMISSIONS[role] ?? [] : [];
}
