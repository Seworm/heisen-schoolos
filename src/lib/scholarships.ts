import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { academicYears, scholarships, studentScholarships, students, terms } from "@/db/schema";
import { requireRole, SCHOOL_ADMIN_ROLES } from "@/lib/authorization";
import { parsePositiveMoney, requireUuid } from "@/lib/finance/finance-utils";

export async function createScholarship(input: { schoolId: string; name: string; percentage: string | number; maxAmount?: string | number }) {
  const schoolId = requireUuid(input.schoolId, "School");
  await requireRole(SCHOOL_ADMIN_ROLES, schoolId);
  const name = input.name.trim();
  const percentage = Number(input.percentage);
  if (!name || name.length > 150) throw new Error("Scholarship name is required and cannot exceed 150 characters.");
  if (!Number.isFinite(percentage) || percentage < 0 || percentage > 100) throw new Error("Percentage must be between 0 and 100.");
  const maxAmount = input.maxAmount ? parsePositiveMoney(input.maxAmount, "Maximum amount") : null;
  const [scholarship] = await db.insert(scholarships).values({ schoolId, name, percentage: percentage.toFixed(2), maxAmount }).returning();
  if (!scholarship) throw new Error("Failed to create scholarship.");
  return scholarship;
}

export async function assignScholarship(input: { schoolId: string; studentId: string; scholarshipId: string; academicYearId: string; termId: string; amount?: string | number }) {
  const schoolId = requireUuid(input.schoolId, "School");
  await requireRole(SCHOOL_ADMIN_ROLES, schoolId);
  const ids = [input.studentId, input.scholarshipId, input.academicYearId, input.termId].map((id) => requireUuid(id, "Selection"));
  const [student] = await db.select({ id: students.id }).from(students).where(and(eq(students.id, ids[0],), eq(students.schoolId, schoolId))).limit(1);
  const [scholarship] = await db.select({ id: scholarships.id }).from(scholarships).where(and(eq(scholarships.id, ids[1]), eq(scholarships.schoolId, schoolId), eq(scholarships.active, true))).limit(1);
  const [term] = await db.select({ id: terms.id, academicYearId: terms.academicYearId }).from(terms).innerJoin(academicYears, eq(academicYears.id, terms.academicYearId)).where(and(eq(terms.id, ids[3]), eq(academicYears.id, ids[2]), eq(academicYears.schoolId, schoolId))).limit(1);
  if (!student || !scholarship || !term) throw new Error("The selected scholarship assignment is invalid.");
  const [existing] = await db.select({ id: studentScholarships.id }).from(studentScholarships).where(and(eq(studentScholarships.schoolId, schoolId), eq(studentScholarships.studentId, ids[0]), eq(studentScholarships.academicYearId, ids[2]), eq(studentScholarships.termId, ids[3]))).limit(1);
  if (existing) throw new Error("This student already has financial aid assigned for the selected term.");
  const amount = input.amount ? parsePositiveMoney(input.amount, "Award amount") : null;
  const [assignment] = await db.insert(studentScholarships).values({ schoolId, studentId: ids[0], scholarshipId: ids[1], academicYearId: ids[2], termId: ids[3], amount }).returning();
  return assignment;
}
