import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  academicYears,
  classLevels,
  feeAssignments,
  feedingFeeCollections,
  feedingFeeSettings,
  staff,
  streams,
  studentEnrollments,
  students,
  teacherAssignments,
} from "@/db/schema";
import { requirePermission, requireRole, isPlatformUser } from "@/lib/authorization";
import { parsePositiveMoney, requireUuid } from "@/lib/finance/finance-utils";

function requireDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error("A valid collection date is required.");
  return value;
}

async function requireClassCollectionAccess(classLevelId: string, academicYearId: string) {
  const user = await requirePermission("feeding.manage");
  if (isPlatformUser(user) || ["school_owner", "school_admin", "principal", "headteacher", "accountant", "bursar"].includes(user.role ?? "")) {
    return user;
  }
  if (!user.email) throw new Error("Your account is not linked to a staff profile.");
  const [access] = await db
    .select({ id: teacherAssignments.id })
    .from(teacherAssignments)
    .innerJoin(staff, eq(staff.id, teacherAssignments.staffId))
    .innerJoin(streams, eq(streams.id, teacherAssignments.streamId))
    .where(and(
      eq(staff.email, user.email),
      eq(staff.schoolId, user.schoolId ?? ""),
      eq(staff.status, "active"),
      eq(streams.classLevelId, classLevelId),
      eq(teacherAssignments.academicYearId, academicYearId),
    ))
    .limit(1);
  if (!access) throw new Error("You do not have access to collect fees for this class.");
  return user;
}

export async function saveFeedingFeeSetting(input: {
  schoolId: string;
  academicYearId: string;
  classLevelId: string;
  dailyAmount: string | number;
  termlyAmount?: string | number | null;
}) {
  const schoolId = requireUuid(input.schoolId, "School");
  const academicYearId = requireUuid(input.academicYearId, "Academic year");
  const classLevelId = requireUuid(input.classLevelId, "Class level");
  await requireRole(["school_owner", "school_admin", "principal", "headteacher", "accountant", "bursar"], schoolId);
  const dailyAmount = parsePositiveMoney(input.dailyAmount, "Daily feeding fee");
  const termlyAmount = input.termlyAmount ? parsePositiveMoney(input.termlyAmount, "Termly feeding fee") : null;
  const [classLevel] = await db.select({ id: classLevels.id }).from(classLevels).where(and(eq(classLevels.id, classLevelId), eq(classLevels.schoolId, schoolId))).limit(1);
  if (!classLevel) throw new Error("Class level not found.");
  const [year] = await db.select({ id: academicYears.id }).from(academicYears).where(and(eq(academicYears.id, academicYearId), eq(academicYears.schoolId, schoolId))).limit(1);
  if (!year) throw new Error("Academic year not found.");
  const [existing] = await db.select({ id: feedingFeeSettings.id }).from(feedingFeeSettings).where(and(eq(feedingFeeSettings.schoolId, schoolId), eq(feedingFeeSettings.academicYearId, academicYearId), eq(feedingFeeSettings.classLevelId, classLevelId))).limit(1);
  if (existing) {
    return db.update(feedingFeeSettings).set({ dailyAmount, termlyAmount, active: true, updatedAt: new Date() }).where(eq(feedingFeeSettings.id, existing.id)).returning();
  }
  return db.insert(feedingFeeSettings).values({ schoolId, academicYearId, classLevelId, dailyAmount, termlyAmount }).returning();
}

export async function collectDailyFeedingFee(input: {
  schoolId: string;
  studentId: string;
  academicYearId: string;
  collectionDate: string;
  amount: string | number;
  method: "cash" | "mobile_money" | "bank_transfer" | "card" | "other";
  receiptNumber: string;
  notes?: string;
}) {
  const schoolId = requireUuid(input.schoolId, "School");
  const studentId = requireUuid(input.studentId, "Student");
  const academicYearId = requireUuid(input.academicYearId, "Academic year");
  const collectionDate = requireDate(input.collectionDate);
  const amount = parsePositiveMoney(input.amount, "Collected amount");
  const receiptNumber = input.receiptNumber.trim();
  if (!receiptNumber) throw new Error("Receipt number is required.");
  const [enrollment] = await db
    .select({ studentId: students.id, classLevelId: classLevels.id, streamId: streams.id })
    .from(studentEnrollments)
    .innerJoin(students, eq(students.id, studentEnrollments.studentId))
    .innerJoin(streams, eq(streams.id, studentEnrollments.streamId))
    .innerJoin(classLevels, eq(classLevels.id, streams.classLevelId))
    .where(and(
      eq(studentEnrollments.studentId, studentId),
      eq(studentEnrollments.academicYearId, academicYearId),
      eq(studentEnrollments.status, "active"),
      eq(students.schoolId, schoolId),
      eq(classLevels.schoolId, schoolId),
    ))
    .limit(1);
  if (!enrollment) throw new Error("The student is not actively enrolled in this school year.");
  const user = await requireClassCollectionAccess(enrollment.classLevelId, academicYearId);
  const [mode] = await db.select({ mode: feeAssignments.feedingPaymentMode })
    .from(feeAssignments)
    .where(and(eq(feeAssignments.studentId, studentId), eq(feeAssignments.academicYearId, academicYearId), eq(feeAssignments.schoolId, schoolId), eq(feeAssignments.status, "active")))
    .limit(1);
  if (mode?.mode !== "daily") throw new Error("This student is configured for termly feeding fees.");
  const [setting] = await db.select({ dailyAmount: feedingFeeSettings.dailyAmount })
    .from(feedingFeeSettings)
    .where(and(eq(feedingFeeSettings.schoolId, schoolId), eq(feedingFeeSettings.academicYearId, academicYearId), eq(feedingFeeSettings.classLevelId, enrollment.classLevelId), eq(feedingFeeSettings.active, true)))
    .limit(1);
  if (!setting || Number(amount) !== Number(setting.dailyAmount)) throw new Error("The collected amount must match the configured daily feeding fee.");
  const [existing] = await db.select({ id: feedingFeeCollections.id }).from(feedingFeeCollections).where(and(eq(feedingFeeCollections.schoolId, schoolId), eq(feedingFeeCollections.studentId, studentId), eq(feedingFeeCollections.collectionDate, collectionDate))).limit(1);
  if (existing) throw new Error("A feeding fee has already been recorded for this student and date.");
  return db.insert(feedingFeeCollections).values({
    schoolId, studentId, classLevelId: enrollment.classLevelId, streamId: enrollment.streamId,
    academicYearId, collectionDate, amount, method: input.method, receiptNumber,
    collectedBy: user.id, notes: input.notes?.trim() || null,
  }).returning();
}

export async function setStudentFeedingPaymentMode(input: {
  schoolId: string;
  studentId: string;
  academicYearId: string;
  mode: "daily" | "termly";
}) {
  const schoolId = requireUuid(input.schoolId, "School");
  const studentId = requireUuid(input.studentId, "Student");
  const academicYearId = requireUuid(input.academicYearId, "Academic year");
  await requireRole(["school_owner", "school_admin", "principal", "headteacher", "accountant", "bursar"], schoolId);
  const [assignment] = await db
    .select({ id: feeAssignments.id })
    .from(feeAssignments)
    .where(and(
      eq(feeAssignments.schoolId, schoolId),
      eq(feeAssignments.studentId, studentId),
      eq(feeAssignments.academicYearId, academicYearId),
      eq(feeAssignments.status, "active"),
    ))
    .limit(1);
  if (!assignment) throw new Error("Assign a term fee structure to the student before choosing a feeding payment mode.");
  return db.update(feeAssignments)
    .set({ feedingPaymentMode: input.mode })
    .where(eq(feeAssignments.id, assignment.id))
    .returning();
}
