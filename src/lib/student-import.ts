import { and, eq, inArray } from "drizzle-orm";
import * as XLSX from "xlsx";
import { db } from "@/db";
import { academicYears, classLevels, streams, studentEnrollments, students, studentImports } from "@/db/schema";
import { studentInputSchema, type StudentInput } from "@/lib/validation";

export type ImportError = { row: number; errors: string[] };
export type ImportedStudent = StudentInput & { className: string };
export type StudentImportPreview = { headers: string[]; rows: ImportedStudent[]; errors: ImportError[]; totalRows: number };

export function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let value = "";
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === "\"") {
      if (quoted && line[i + 1] === "\"") { value += "\""; i += 1; } else quoted = !quoted;
    } else if (char === "," && !quoted) { values.push(value.trim()); value = ""; } else value += char;
  }
  values.push(value.trim());
  return values;
}

function normalizeRecords(records: Array<Record<string, string>>): StudentImportPreview {
  const headers = records.length ? Object.keys(records[0]) : [];
  if (!headers.some((header) => ["first_name", "firstname"].includes(header)) ||
      !headers.some((header) => ["last_name", "lastname"].includes(header)) ||
      !headers.includes("gender") ||
      !headers.some((header) => ["class", "class_name", "class_level"].includes(header))) {
    throw new Error("File must include first_name, last_name, gender, and class columns.");
  }
  const rows: ImportedStudent[] = [];
  const errors: ImportError[] = [];
  const seen = new Set<string>();
  records.forEach((raw, index) => {
    const row = index + 2;
    const normalized = {
      ...raw,
      studentNumber: raw.studentNumber || raw.student_number || `IMPORT-${row}`,
      firstName: raw.firstName || raw.first_name || raw.firstname || "",
      lastName: raw.lastName || raw.last_name || raw.lastname || "",
      gender: String(raw.gender || "").trim().toLowerCase(),
    };
    const className = String(raw.class || raw.class_name || raw.class_level || "").trim();
    const parsed = studentInputSchema.safeParse(normalized);
    if (!className) errors.push({ row, errors: ["class: Class is required."] });
    if (!parsed.success) errors.push({ row, errors: parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`) });
    else if (seen.has(parsed.data.studentNumber)) errors.push({ row, errors: ["Student number is duplicated in this file."] });
    else { seen.add(parsed.data.studentNumber); rows.push({ ...parsed.data, className }); }
  });
  return { headers, rows, errors, totalRows: records.length };
}

export function previewStudentsCsv(csv: string): StudentImportPreview {
  const lines = csv.replace(/^\uFEFF/, "").split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) throw new Error("CSV must contain a header and at least one data row.");
  const headers = parseCsvLine(lines[0]).map((header) => header.toLowerCase().trim().replace(/\s+/g, "_"));
  return normalizeRecords(lines.slice(1).map((line) => Object.fromEntries(headers.map((header, column) => [header, parseCsvLine(line)[column] ?? ""]))));
}

export function previewStudentsExcel(buffer: ArrayBuffer): StudentImportPreview {
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  if (!sheet) throw new Error("Excel file does not contain a worksheet.");
  const records = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" }).map((record) =>
    Object.fromEntries(Object.entries(record).map(([key, value]) => [key.toLowerCase().trim().replace(/\s+/g, "_"), String(value ?? "").trim()])),
  );
  if (!records.length) throw new Error("Excel file must contain a header and at least one data row.");
  return normalizeRecords(records);
}

export async function commitStudentsImport(input: { schoolId: string; actorId: string; filename: string; preview: StudentImportPreview }) {
  const errors = [...input.preview.errors];
  const [academicYear] = await db.select({ id: academicYears.id }).from(academicYears).where(and(eq(academicYears.schoolId, input.schoolId), eq(academicYears.isCurrent, true))).limit(1);
  if (!academicYear) throw new Error("Set a current academic year before importing students.");
  const classes = await db.select({ id: classLevels.id, name: classLevels.name }).from(classLevels).where(eq(classLevels.schoolId, input.schoolId));
  const classMap = new Map(classes.map((item) => [item.name.toLowerCase(), item.id]));
  const classIds = classes.map((item) => item.id);
  const streamRows = classIds.length ? await db.select({ id: streams.id, classLevelId: streams.classLevelId, name: streams.name }).from(streams).where(inArray(streams.classLevelId, classIds)) : [];
  const streamMap = new Map(streamRows.map((item) => [`${item.classLevelId}:${item.name.toLowerCase()}`, item.id]));
  const validWithClasses = input.preview.rows.filter((student, index) => {
    const classId = classMap.get(student.className.toLowerCase());
    const streamId = classId ? streamMap.get(`${classId}:a`) : undefined;
    if (!classId) errors.push({ row: index + 2, errors: [`class: ${student.className} was not found in this school.`] });
    else if (!streamId) errors.push({ row: index + 2, errors: [`class: Stream A is missing for ${student.className}.`] });
    return Boolean(classId && streamId);
  });
  const numbers = validWithClasses.map((row) => row.studentNumber);
  const existing = numbers.length ? await db.select({ studentNumber: students.studentNumber }).from(students).where(and(eq(students.schoolId, input.schoolId), inArray(students.studentNumber, numbers))) : [];
  const existingNumbers = new Set(existing.map((row) => row.studentNumber));
  const valid = validWithClasses.filter((student, index) => {
    if (!existingNumbers.has(student.studentNumber)) return true;
    errors.push({ row: index + 2, errors: [`Student number ${student.studentNumber} already exists in this school.`] });
    return false;
  });
  await db.transaction(async (tx) => {
    for (const student of valid) {
      const classId = classMap.get(student.className.toLowerCase());
      const streamId = classId ? streamMap.get(`${classId}:a`) : undefined;
      if (!classId || !streamId) continue;
      const [created] = await tx.insert(students).values({
        schoolId: input.schoolId, studentNumber: student.studentNumber, admissionNumber: student.admissionNumber || null,
        firstName: student.firstName, middleName: student.middleName || null, lastName: student.lastName, gender: student.gender,
        dateOfBirth: student.dateOfBirth || null, admissionDate: student.admissionDate || null, phone: student.phone || null,
        email: student.email || null, address: student.address || null, nationality: student.nationality || "Ghanaian",
      }).returning({ id: students.id });
      if (created) await tx.insert(studentEnrollments).values({ studentId: created.id, academicYearId: academicYear.id, streamId, admissionNumber: student.admissionNumber || null, enrollmentDate: new Date().toISOString().slice(0, 10), status: "active" });
    }
    await tx.insert(studentImports).values({ schoolId: input.schoolId, createdBy: input.actorId, filename: input.filename, totalRows: input.preview.totalRows, validRows: valid.length, invalidRows: errors.length, errors, status: errors.length ? "completed_with_errors" : "completed" });
  });
  return { totalRows: input.preview.totalRows, validRows: valid.length, invalidRows: errors.length, errors };
}

export async function importStudentsCsv(input: { schoolId: string; actorId: string; filename: string; csv: string }) {
  return commitStudentsImport({ ...input, preview: previewStudentsCsv(input.csv) });
}

export async function importStudentsExcel(input: { schoolId: string; actorId: string; filename: string; buffer: ArrayBuffer }) {
  return commitStudentsImport({ ...input, preview: previewStudentsExcel(input.buffer) });
}
