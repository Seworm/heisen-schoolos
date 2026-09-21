"use server";

import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { disciplineIncidents, libraryBooks, libraryLoans, safeguardingCases, studentHealthRecords, students, transportAssignments, transportRoutes } from "@/db/schema";
import { requireCurrentSchool } from "@/lib/current-school";
import { requireRole, SCHOOL_ADMIN_ROLES } from "@/lib/authorization";
import { writeAuditLog } from "@/lib/audit";

const HEALTH_ROLES = [...SCHOOL_ADMIN_ROLES, "school_nurse", "counselor", "safeguarding_lead"];
const LIBRARY_ROLES = [...SCHOOL_ADMIN_ROLES, "librarian"];
const TRANSPORT_ROLES = [...SCHOOL_ADMIN_ROLES, "transport_manager"];
const DISCIPLINE_ROLES = [...SCHOOL_ADMIN_ROLES, "teacher", "head_of_year"];

function value(form: FormData, key: string) {
  const result = String(form.get(key) ?? "").trim();
  if (!result) throw new Error(`${key} is required.`);
  return result;
}

async function studentInSchool(studentId: string, schoolId: string) {
  const [student] = await db.select({ id: students.id }).from(students).where(and(eq(students.id, studentId), eq(students.schoolId, schoolId))).limit(1);
  if (!student) throw new Error("Student was not found in this school.");
}

export async function addLibraryBook(form: FormData) {
  const school = await requireCurrentSchool(); const actor = await requireRole(LIBRARY_ROLES, school.id);
  const total = Number(form.get("copiesTotal") || 1); if (!Number.isInteger(total) || total < 1) throw new Error("Copies must be a positive whole number.");
  const [book] = await db.insert(libraryBooks).values({ schoolId: school.id, title: value(form, "title"), author: String(form.get("author") || "").trim() || null, isbn: String(form.get("isbn") || "").trim() || null, category: String(form.get("category") || "").trim() || null, copiesTotal: total, copiesAvailable: total }).returning({ id: libraryBooks.id });
  await writeAuditLog({ schoolId: school.id, actorAuthUserId: actor.id, action: "create", entity: "library_book", entityId: book.id });
  revalidatePath("/student-services"); 
}

export async function issueLibraryBook(form: FormData) {
  const school = await requireCurrentSchool(); const actor = await requireRole(LIBRARY_ROLES, school.id);
  const bookId = value(form, "bookId"); const studentId = value(form, "studentId"); await studentInSchool(studentId, school.id);
  const dueAt = value(form, "dueAt");
  const [book] = await db.update(libraryBooks).set({ copiesAvailable: sql`${libraryBooks.copiesAvailable} - 1`, updatedAt: new Date() }).where(and(eq(libraryBooks.id, bookId), eq(libraryBooks.schoolId, school.id), sql`${libraryBooks.copiesAvailable} > 0`)).returning({ id: libraryBooks.id });
  if (!book) throw new Error("Book is unavailable.");
  const [loan] = await db.insert(libraryLoans).values({ schoolId: school.id, bookId, studentId, issuedBy: actor.id, dueAt }).returning({ id: libraryLoans.id });
  await writeAuditLog({ schoolId: school.id, actorAuthUserId: actor.id, action: "issue", entity: "library_loan", entityId: loan.id });
  revalidatePath("/student-services");
}

export async function addTransportRoute(form: FormData) {
  const school = await requireCurrentSchool(); const actor = await requireRole(TRANSPORT_ROLES, school.id);
  const [route] = await db.insert(transportRoutes).values({ schoolId: school.id, name: value(form, "name"), vehicleNumber: String(form.get("vehicleNumber") || "").trim() || null, driverName: String(form.get("driverName") || "").trim() || null, driverPhone: String(form.get("driverPhone") || "").trim() || null, stops: String(form.get("stops") || "").split(",").map((s) => s.trim()).filter(Boolean) }).returning({ id: transportRoutes.id });
  await writeAuditLog({ schoolId: school.id, actorAuthUserId: actor.id, action: "create", entity: "transport_route", entityId: route.id });
  revalidatePath("/student-services");
}

export async function assignTransport(form: FormData) {
  const school = await requireCurrentSchool(); const actor = await requireRole(TRANSPORT_ROLES, school.id);
  const studentId = value(form, "studentId"); await studentInSchool(studentId, school.id);
  const [assignment] = await db.insert(transportAssignments).values({ schoolId: school.id, routeId: value(form, "routeId"), studentId, pickupStop: String(form.get("pickupStop") || "").trim() || null, dropoffStop: String(form.get("dropoffStop") || "").trim() || null }).returning({ id: transportAssignments.id });
  await writeAuditLog({ schoolId: school.id, actorAuthUserId: actor.id, action: "assign", entity: "transport_assignment", entityId: assignment.id });
  revalidatePath("/student-services");
}

export async function addHealthRecord(form: FormData) {
  const school = await requireCurrentSchool(); const actor = await requireRole(HEALTH_ROLES, school.id);
  const studentId = value(form, "studentId"); await studentInSchool(studentId, school.id);
  const [record] = await db.insert(studentHealthRecords).values({ schoolId: school.id, studentId, recordedBy: actor.id, recordType: value(form, "recordType"), details: value(form, "details"), followUp: String(form.get("followUp") || "").trim() || null }).returning({ id: studentHealthRecords.id });
  await writeAuditLog({ schoolId: school.id, actorAuthUserId: actor.id, action: "create", entity: "student_health_record", entityId: record.id, metadata: { confidential: true } });
  revalidatePath("/student-services");
}

export async function addSafeguardingCase(form: FormData) {
  const school = await requireCurrentSchool(); const actor = await requireRole([...SCHOOL_ADMIN_ROLES, "safeguarding_lead", "counselor"], school.id);
  const studentId = value(form, "studentId"); await studentInSchool(studentId, school.id);
  const [record] = await db.insert(safeguardingCases).values({ schoolId: school.id, studentId, reportedBy: actor.id, summary: value(form, "summary"), actionsTaken: String(form.get("actionsTaken") || "").trim() || null }).returning({ id: safeguardingCases.id });
  await writeAuditLog({ schoolId: school.id, actorAuthUserId: actor.id, action: "create", entity: "safeguarding_case", entityId: record.id, metadata: { confidential: true } });
  revalidatePath("/student-services");
}

export async function addDisciplineIncident(form: FormData) {
  const school = await requireCurrentSchool(); const actor = await requireRole(DISCIPLINE_ROLES, school.id);
  const studentId = value(form, "studentId"); await studentInSchool(studentId, school.id);
  const [record] = await db.insert(disciplineIncidents).values({ schoolId: school.id, studentId, reportedBy: actor.id, incidentDate: value(form, "incidentDate"), category: value(form, "category"), description: value(form, "description"), actionTaken: String(form.get("actionTaken") || "").trim() || null }).returning({ id: disciplineIncidents.id });
  await writeAuditLog({ schoolId: school.id, actorAuthUserId: actor.id, action: "create", entity: "discipline_incident", entityId: record.id });
  revalidatePath("/student-services");
}
