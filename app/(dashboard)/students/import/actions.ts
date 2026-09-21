"use server";
import { revalidatePath } from "next/cache";
import { getCurrentSchool } from "@/lib/current-school";
import { requireRole, SCHOOL_ADMIN_ROLES } from "@/lib/authorization";
import { commitStudentsImport, previewStudentsCsv } from "@/lib/student-import";

export async function previewStudentImportAction(formData: FormData) {
  const school = await getCurrentSchool();
  await requireRole(SCHOOL_ADMIN_ROLES, school.id);
  const file = formData.get("file");
  if (!(file instanceof File)) throw new Error("Select a CSV file.");
  return previewStudentsCsv(await file.text());
}

export async function importStudentsAction(formData: FormData): Promise<void> {
  const school = await getCurrentSchool();
  const user = await requireRole(SCHOOL_ADMIN_ROLES, school.id);
  const file = formData.get("file");
  if (!(file instanceof File)) throw new Error("Select a CSV file.");
  const result = await commitStudentsImport({ schoolId: school.id, actorId: user.id, filename: file.name, preview: previewStudentsCsv(await file.text()) });
  revalidatePath("/students");
  revalidatePath("/students/import");
  void result;
}
