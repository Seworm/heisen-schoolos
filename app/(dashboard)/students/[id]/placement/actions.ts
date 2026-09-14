"use server";

import { revalidatePath } from "next/cache";

import { transferStudentPlacement } from "@/lib/placements";

type TransferState = {
  error?: string;
  success?: string;
};

export async function transferPlacement(
  _state: TransferState,
  formData: FormData,
): Promise<TransferState> {
  const studentId = String(formData.get("studentId") ?? "").trim();
  const enrollmentId = String(formData.get("enrollmentId") ?? "").trim();
  const destinationStreamId = String(
    formData.get("destinationStreamId") ?? "",
  ).trim();
  const transferDate = String(
    formData.get("transferDate") ?? "",
  ).trim();

  const result = await transferStudentPlacement({
    studentId,
    enrollmentId,
    destinationStreamId,
    transferDate,
  });

  if (!result.success) {
    return {
      error: result.error,
    };
  }

  revalidatePath(`/students/${studentId}`);

  return {
    success: "Student placement transferred successfully.",
  };
}