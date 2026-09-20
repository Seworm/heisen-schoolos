import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { students, studentImports } from "@/db/schema";
import { studentInputSchema } from "@/lib/validation";

function parseCsvLine(line: string) { const out: string[] = []; let current = ""; let quoted = false; for (let i = 0; i < line.length; i++) { const char = line[i]; if (char === '"') { if (quoted && line[i + 1] === '"') { current += '"'; i++; } else quoted = !quoted; } else if (char === ',' && !quoted) { out.push(current.trim()); current = ""; } else current += char; } out.push(current.trim()); return out; }

export async function importStudentsCsv(input: { schoolId: string; actorId: string; filename: string; csv: string }) {
  const lines = input.csv.replace(/^\uFEFF/, "").split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) throw new Error("CSV must contain a header and at least one data row.");
  const headers = parseCsvLine(lines[0]).map((header) => header.toLowerCase().replace(/\s+/g, "_"));
  const rows = lines.slice(1);
  const errors: Array<{ row: number; errors: string[] }> = [];
  const valid: Array<ReturnType<typeof studentInputSchema.parse>> = [];
  for (let i = 0; i < rows.length; i++) {
    const values = parseCsvLine(rows[i]);
    const raw = Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
    const parsed = studentInputSchema.safeParse(raw);
    if (!parsed.success) errors.push({ row: i + 2, errors: parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`) }); else valid.push(parsed.data);
  }
  const [existing] = valid.length ? await db.select({ id: students.id, studentNumber: students.studentNumber }).from(students).where(and(eq(students.schoolId, input.schoolId), eq(students.studentNumber, valid[0].studentNumber))).limit(1) : [undefined];
  void existing;
  await db.transaction(async (tx) => {
    for (const student of valid) {
      const duplicate = await tx.select({ id: students.id }).from(students).where(and(eq(students.schoolId, input.schoolId), eq(students.studentNumber, student.studentNumber))).limit(1);
      if (duplicate.length) { errors.push({ row: rows.findIndex((line) => line.includes(student.studentNumber)) + 2, errors: ["Student number already exists in this school."] }); continue; }
      await tx.insert(students).values({ schoolId: input.schoolId, studentNumber: student.studentNumber, admissionNumber: student.admissionNumber || null, firstName: student.firstName, middleName: student.middleName || null, lastName: student.lastName, gender: student.gender, dateOfBirth: student.dateOfBirth || null, admissionDate: student.admissionDate || null, phone: student.phone || null, email: student.email || null, address: student.address || null, nationality: student.nationality || "Ghanaian" });
    }
    await tx.insert(studentImports).values({ schoolId: input.schoolId, createdBy: input.actorId, filename: input.filename, totalRows: rows.length, validRows: valid.length - Math.max(0, errors.length), invalidRows: errors.length, errors, status: "completed" });
  });
  return { totalRows: rows.length, validRows: rows.length - errors.length, invalidRows: errors.length, errors };
}
