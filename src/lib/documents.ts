import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { documentRecords, students } from "@/db/schema";

export async function issueStudentDocument(input: { schoolId: string; studentId: string; documentType: string; title: string; payload?: Record<string, unknown>; issuedBy: string }) {
  const [student] = await db.select({ id: students.id, firstName: students.firstName, lastName: students.lastName, studentNumber: students.studentNumber }).from(students).where(and(eq(students.id, input.studentId), eq(students.schoolId, input.schoolId))).limit(1);
  if (!student) throw new Error("Student not found in this school.");
  const number = `${input.documentType.toUpperCase().slice(0, 8)}-${Date.now().toString(36).toUpperCase()}`;
  const [document] = await db.insert(documentRecords).values({ schoolId: input.schoolId, studentId: student.id, documentType: input.documentType, documentNumber: number, title: input.title, payload: { student, ...(input.payload || {}) }, status: "issued", issuedAt: new Date(), issuedBy: input.issuedBy }).returning();
  return document;
}

export function renderPrintableDocument(document: { title: string; documentNumber: string; payload: Record<string, unknown> }) {
  const values = Object.entries(document.payload).filter(([, value]) => typeof value !== "object").map(([key, value]) => `<div><strong>${escapeHtml(key)}:</strong> ${escapeHtml(String(value))}</div>`).join("");
  return `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(document.title)}</title><style>body{font-family:Arial;max-width:760px;margin:48px auto}h1{text-align:center}footer{margin-top:48px;font-size:12px;color:#666}</style></head><body><h1>${escapeHtml(document.title)}</h1>${values}<footer>Document ${escapeHtml(document.documentNumber)}</footer><script>window.print()</script></body></html>`;
}
function escapeHtml(value: string) { return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[char] || char)); }
