"use server";

import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { applicants, students } from "@/db/schema";
import { requireCurrentSchool } from "@/lib/current-school";
import { requireRole } from "@/lib/authorization";
import { writeAuditLog } from "@/lib/audit";
import { provisionStudentAccount } from "@/lib/students/provision-account";

const reviewRoles = ["platform_admin", "super_admin", "school_owner", "school_admin", "principal", "headteacher"];

export async function createApplicant(formData: FormData) {
  const school = await requireCurrentSchool();
  const firstName = String(formData.get("firstName") ?? "").trim();
  const middleName = String(formData.get("middleName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  const guardianName = String(formData.get("guardianName") ?? "").trim();
  const guardianPhone = String(formData.get("guardianPhone") ?? "").trim();
  if (!firstName || !lastName || !guardianName || !guardianPhone) throw new Error("Applicant and guardian details are required.");

  const year = new Date().getFullYear();
  const [{ value }] = await db.select({ value: sql<number>`count(*)` }).from(applicants).where(eq(applicants.schoolId, school.id));
  const applicationNumber = `${school.schoolCode}-${year}-A${String(Number(value) + 1).padStart(4, "0")}`;
  await db.insert(applicants).values({
    schoolId: school.id, applicationNumber, firstName, middleName: middleName || null, lastName,
    gender: (String(formData.get("gender") ?? "") || null) as "male" | "female" | null,
    dateOfBirth: String(formData.get("dateOfBirth") ?? "") || null, guardianName, guardianPhone,
    guardianEmail: String(formData.get("guardianEmail") ?? "") || null,
    requestedGrade: String(formData.get("requestedGrade") ?? "") || null,
    notes: String(formData.get("notes") ?? "") || null,
  }).returning({ id: applicants.id, applicationNumber: applicants.applicationNumber });
  await writeAuditLog({ schoolId: school.id, actorAuthUserId: "public-intake", action: "applicant_submitted", entity: "applicant", metadata: { applicationNumber } });
  revalidatePath("/admissions");
}

async function updateStatus(id: string, status: "under_review" | "accepted" | "rejected", decisionNotes?: string) {
  const actor = await requireRole(reviewRoles);
  const school = await requireCurrentSchool();
  const [applicant] = await db.select({ id: applicants.id, status: applicants.status }).from(applicants).where(and(eq(applicants.id, id), eq(applicants.schoolId, school.id))).limit(1);
  if (!applicant) throw new Error("Applicant not found.");
  if (status === "accepted" && applicant.status !== "under_review") throw new Error("Move the application to review before accepting it.");
  await db.update(applicants).set({ status, decisionNotes: decisionNotes || null, reviewedAt: status === "under_review" ? new Date() : undefined, decidedAt: status === "accepted" || status === "rejected" ? new Date() : undefined, updatedAt: new Date() }).where(eq(applicants.id, id));
  await writeAuditLog({ schoolId: school.id, actorAuthUserId: actor.authUserId ?? actor.id, action: `applicant_${status}`, entity: "applicant", entityId: id, metadata: { decisionNotes } });
  revalidatePath("/admissions");
}

export async function markApplicantUnderReview(id: string) { return updateStatus(id, "under_review"); }
export async function decideApplicant(id: string, decision: "accepted" | "rejected", formData: FormData) {
  return updateStatus(id, decision, String(formData.get("decisionNotes") ?? "").trim() || undefined);
}

export async function convertApplicant(id: string) {
  const actor = await requireRole(reviewRoles);
  const school = await requireCurrentSchool();
  const [applicant] = await db.select().from(applicants).where(and(eq(applicants.id, id), eq(applicants.schoolId, school.id))).limit(1);
  if (!applicant || applicant.status !== "accepted") throw new Error("Only accepted applicants can be converted.");
  if (!applicant.gender || !applicant.dateOfBirth) throw new Error("Gender and date of birth are required before conversion.");
  const [{ value }] = await db.select({ value: sql<number>`count(*)` }).from(students).where(eq(students.schoolId, school.id));
  const studentNumber = `${school.schoolCode}-${new Date().getFullYear()}-${String(Number(value) + 1).padStart(4, "0")}`;
  const [student] = await db.insert(students).values({ schoolId: school.id, studentNumber, admissionNumber: applicant.applicationNumber, firstName: applicant.firstName, middleName: applicant.middleName, lastName: applicant.lastName, gender: applicant.gender, dateOfBirth: applicant.dateOfBirth, admissionDate: new Date().toISOString().slice(0, 10), phone: applicant.guardianPhone, email: applicant.guardianEmail }).returning({ id: students.id });
  if (!student) throw new Error("Student could not be created.");
  try { await provisionStudentAccount(student.id); } catch (error) { await db.delete(students).where(eq(students.id, student.id)); throw error; }
  await db.update(applicants).set({ status: "converted", convertedStudentId: student.id, updatedAt: new Date() }).where(eq(applicants.id, id));
  await writeAuditLog({ schoolId: school.id, actorAuthUserId: actor.authUserId ?? actor.id, action: "applicant_converted", entity: "applicant", entityId: id, metadata: { studentId: student.id } });
  revalidatePath("/admissions"); revalidatePath("/students");
}
