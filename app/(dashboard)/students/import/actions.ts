"use server";
import { revalidatePath } from "next/cache";
import { getCurrentSchool } from "@/lib/current-school";
import { requireRole, SCHOOL_ADMIN_ROLES } from "@/lib/authorization";
import { commitStudentsImport, previewStudentsCsv, previewStudentsExcel } from "@/lib/student-import";

export async function previewStudentImportAction(formData: FormData) {
  const school = await getCurrentSchool();
  await requireRole(SCHOOL_ADMIN_ROLES, school.id);
  const file = formData.get("file");
  if (!(file instanceof File)) throw new Error("Select a CSV or Excel file.");
  const preview = file.name.toLowerCase().endsWith(".csv")
    ? previewStudentsCsv(await file.text())
    : previewStudentsExcel(await file.arrayBuffer());
  return preview;
}

export async function importStudentsAction(formData: FormData): Promise<void> {
  const school = await getCurrentSchool();
  const user = await requireRole(SCHOOL_ADMIN_ROLES, school.id);
  const file = formData.get("file");
  if (!(file instanceof File)) throw new Error("Select a CSV or Excel file.");
  const preview = file.name.toLowerCase().endsWith(".csv")
    ? previewStudentsCsv(await file.text())
    : previewStudentsExcel(await file.arrayBuffer());
  const result = await commitStudentsImport({ schoolId: school.id, actorId: user.id, filename: file.name, preview });
  revalidatePath("/students");
  revalidatePath("/students/import");
  void result;
}
