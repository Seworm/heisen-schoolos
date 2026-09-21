import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { students, studentImports } from "@/db/schema";
import { studentInputSchema, type StudentInput } from "@/lib/validation";

export type ImportError = { row: number; errors: string[] };
export type StudentImportPreview = {
  headers: string[];
  rows: StudentInput[];
  errors: ImportError[];
  totalRows: number;
};

export function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let value = "";
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === "\"") {
      if (quoted && line[i + 1] === "\"") { value += "\""; i += 1; }
      else quoted = !quoted;
    } else if (char === "," && !quoted) { values.push(value.trim()); value = ""; }
    else value += char;
  }
  values.push(value.trim());
  return values;
}

export function previewStudentsCsv(csv: string): StudentImportPreview {
  const lines = csv.replace(/^\uFEFF/, "").split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) throw new Error("CSV must contain a header and at least one data row.");
  const headers = parseCsvLine(lines[0]).map((header) => header.toLowerCase().trim().replace(/\s+/g, "_"));
  const required = ["studentnumber", "student_number", "firstname", "first_name", "lastname", "last_name", "gender"];
  const canonical = new Set(headers);
  if (!required.some((header) => canonical.has(header))) throw new Error("CSV is missing student identity columns.");
  const rows: StudentInput[] = [];
  const errors: ImportError[] = [];
  const seen = new Set<string>();
  lines.slice(1).forEach((line, index) => {
    const rowNumber = index + 2;
    const raw = Object.fromEntries(headers.map((header, column) => [header, parseCsvLine(line)[column] ?? ""]));
    const normalized = {
      ...raw,
      studentNumber: raw.studentNumber || raw.student_number || "",
      firstName: raw.firstName || raw.first_name || "",
      lastName: raw.lastName || raw.last_name || "",
    };
    const parsed = studentInputSchema.safeParse(normalized);
    if (!parsed.success) errors.push({ row: rowNumber, errors: parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`) });
    else if (seen.has(parsed.data.studentNumber)) errors.push({ row: rowNumber, errors: ["Student number is duplicated in this file."] });
    else { seen.add(parsed.data.studentNumber); rows.push(parsed.data); }
  });
  return { headers, rows, errors, totalRows: lines.length - 1 };
}

export async function commitStudentsImport(input: { schoolId: string; actorId: string; filename: string; preview: StudentImportPreview }) {
  const errors = [...input.preview.errors];
  const numbers = input.preview.rows.map((row) => row.studentNumber);
  const existing = numbers.length ? await db.select({ studentNumber: students.studentNumber }).from(students).where(and(eq(students.schoolId, input.schoolId), inArray(students.studentNumber, numbers))) : [];
  const existingNumbers = new Set(existing.map((row) => row.studentNumber));
  const valid = input.preview.rows.filter((student) => {
    if (!existingNumbers.has(student.studentNumber)) return true;
    errors.push({ row: 0, errors: [`Student number ${student.studentNumber} already exists in this school.`] });
    return false;
  });
  await db.transaction(async (tx) => {
    if (valid.length) await tx.insert(students).values(valid.map((student) => ({
      schoolId: input.schoolId, studentNumber: student.studentNumber, admissionNumber: student.admissionNumber || null,
      firstName: student.firstName, middleName: student.middleName || null, lastName: student.lastName, gender: student.gender,
      dateOfBirth: student.dateOfBirth || null, admissionDate: student.admissionDate || null, phone: student.phone || null,
      email: student.email || null, address: student.address || null, nationality: student.nationality || "Ghanaian",
    })));
    await tx.insert(studentImports).values({
      schoolId: input.schoolId, createdBy: input.actorId, filename: input.filename,
      totalRows: input.preview.totalRows, validRows: valid.length, invalidRows: errors.length, errors, status: errors.length ? "completed_with_errors" : "completed",
    });
  });
  return { totalRows: input.preview.totalRows, validRows: valid.length, invalidRows: errors.length, errors };
}

export async function importStudentsCsv(input: { schoolId: string; actorId: string; filename: string; csv: string }) {
  return commitStudentsImport({ ...input, preview: previewStudentsCsv(input.csv) });
}
