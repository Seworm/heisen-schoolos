"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentSchool } from "@/lib/current-school";
import {
  createFeeCategory,
  updateFeeCategory,
  setFeeCategoryActive,
  createFeeStructure,
  replaceFeeStructureItems,
  setFeeStructureActive,
} from "@/lib/finance/fee-structures";
import {
  assignFeeStructureToStudent,
  generateInvoiceForAssignment,
  issueInvoice,
  cancelInvoice,
} from "@/lib/finance/invoices";
import {
  recordPayment,
  reversePayment,
} from "@/lib/finance/payments";
import type { PaymentMethod } from "@/lib/finance/finance-utils";

function financePath() {
  return "/finance";
}

export async function createFeeCategoryAction(formData: FormData) {
  const school = await getCurrentSchool();

  const category = await createFeeCategory({
    schoolId: school.id,
    name: String(formData.get("name") ?? ""),
    description: String(formData.get("description") ?? ""),
  });

  revalidatePath(financePath());
  revalidatePath("/finance/fee-structures");

  return {
    success: true,
    category,
  };
}

export async function updateFeeCategoryAction(formData: FormData) {
  const school = await getCurrentSchool();

  const category = await updateFeeCategory({
    schoolId: school.id,
    categoryId: String(formData.get("categoryId") ?? ""),
    name: String(formData.get("name") ?? ""),
    description: String(formData.get("description") ?? ""),
  });

  revalidatePath(financePath());
  revalidatePath("/finance/fee-structures");

  return {
    success: true,
    category,
  };
}

export async function toggleFeeCategoryAction(formData: FormData) {
  const school = await getCurrentSchool();

  const isActive =
    String(formData.get("isActive")) === "true";

  const category = await setFeeCategoryActive(
    school.id,
    String(formData.get("categoryId") ?? ""),
    isActive,
  );

  revalidatePath(financePath());
  revalidatePath("/finance/fee-structures");

  return {
    success: true,
    category,
  };
}

export async function createFeeStructureAction(formData: FormData) {
  const school = await getCurrentSchool();

  const rawItems = String(
    formData.get("items") ?? "[]",
  );

  let items: Array<{
    feeCategoryId: string;
    amount: string;
    description?: string;
  }>;

  try {
    items = JSON.parse(rawItems);
  } catch {
    throw new Error("Fee structure items are invalid.");
  }

  const structure = await createFeeStructure({
    schoolId: school.id,
    academicYearId: String(
      formData.get("academicYearId") ?? "",
    ),
    termId: String(formData.get("termId") ?? ""),
    classLevelId: String(
      formData.get("classLevelId") ?? "",
    ),
    name: String(formData.get("name") ?? ""),
    description: String(formData.get("description") ?? ""),
    items,
  });

  revalidatePath(financePath());
  revalidatePath("/finance/fee-structures");

  redirect(`/finance/fee-structures/${structure.id}`);
}

export async function updateFeeStructureItemsAction(
  formData: FormData,
) {
  const school = await getCurrentSchool();

  const rawItems = String(
    formData.get("items") ?? "[]",
  );

  let items: Array<{
    feeCategoryId: string;
    amount: string;
    description?: string;
  }>;

  try {
    items = JSON.parse(rawItems);
  } catch {
    throw new Error("Fee structure items are invalid.");
  }

  await replaceFeeStructureItems({
    schoolId: school.id,
    feeStructureId: String(
      formData.get("feeStructureId") ?? "",
    ),
    items,
  });

  revalidatePath(financePath());
  revalidatePath("/finance/fee-structures");

  return {
    success: true,
  };
}

export async function toggleFeeStructureAction(
  formData: FormData,
) {
  const school = await getCurrentSchool();

  const isActive =
    String(formData.get("isActive")) === "true";

  const structure = await setFeeStructureActive(
    school.id,
    String(formData.get("feeStructureId") ?? ""),
    isActive,
  );

  revalidatePath(financePath());
  revalidatePath("/finance/fee-structures");

  return {
    success: true,
    structure,
  };
}

export async function assignFeeStructureAction(
  formData: FormData,
) {
  const school = await getCurrentSchool();

  const assignment =
    await assignFeeStructureToStudent({
      schoolId: school.id,
      studentId: String(
        formData.get("studentId") ?? "",
      ),
      feeStructureId: String(
        formData.get("feeStructureId") ?? "",
      ),
      academicYearId: String(
        formData.get("academicYearId") ?? "",
      ),
      termId: String(formData.get("termId") ?? ""),
    });

  revalidatePath(financePath());
  revalidatePath("/finance/invoices");

  return {
    success: true,
    assignment,
  };
}

export async function generateInvoiceAction(
  formData: FormData,
) {
  const school = await getCurrentSchool();

  const invoice =
    await generateInvoiceForAssignment({
      schoolId: school.id,
      feeAssignmentId: String(
        formData.get("feeAssignmentId") ?? "",
      ),
      issueDate:
        String(formData.get("issueDate") ?? "") || undefined,
      dueDate:
        String(formData.get("dueDate") ?? "") || undefined,
      notes:
        String(formData.get("notes") ?? "") || undefined,
    });

  revalidatePath(financePath());
  revalidatePath("/finance/invoices");

  redirect(`/finance/invoices/${invoice.id}`);
}

export async function issueInvoiceAction(
  formData: FormData,
) {
  const school = await getCurrentSchool();

  const invoice = await issueInvoice(
    school.id,
    String(formData.get("invoiceId") ?? ""),
  );

  revalidatePath(financePath());
  revalidatePath("/finance/invoices");
  revalidatePath(
    `/finance/invoices/${invoice.id}`,
  );

  return {
    success: true,
    invoice,
  };
}

export async function cancelInvoiceAction(
  formData: FormData,
) {
  const school = await getCurrentSchool();

  const invoice = await cancelInvoice(
    school.id,
    String(formData.get("invoiceId") ?? ""),
  );

  revalidatePath(financePath());
  revalidatePath("/finance/invoices");
  revalidatePath(
    `/finance/invoices/${invoice.id}`,
  );

  return {
    success: true,
    invoice,
  };
}

export async function recordPaymentAction(
  formData: FormData,
) {
  const school = await getCurrentSchool();

  const rawAllocations = String(
    formData.get("allocations") ?? "[]",
  );

  let allocations: Array<{
    invoiceId: string;
    amount: string;
  }>;

  try {
    allocations = JSON.parse(rawAllocations);
  } catch {
    throw new Error("Payment allocations are invalid.");
  }

  const payment = await recordPayment({
    schoolId: school.id,
    studentId: String(
      formData.get("studentId") ?? "",
    ),
    amount: String(formData.get("amount") ?? ""),
    method: String(
      formData.get("method") ?? "",
    ) as PaymentMethod,
    paymentDate:
      String(formData.get("paymentDate") ?? "") ||
      undefined,
    reference:
      String(formData.get("reference") ?? "") ||
      undefined,
    notes:
      String(formData.get("notes") ?? "") ||
      undefined,
    allocations,
  });

  revalidatePath(financePath());
  revalidatePath("/finance/payments");
  revalidatePath("/finance/invoices");

  return {
    success: true,
    payment,
  };
}

export async function reversePaymentAction(
  formData: FormData,
) {
  const school = await getCurrentSchool();

  await reversePayment(
    school.id,
    String(formData.get("paymentId") ?? ""),
  );

  revalidatePath(financePath());
  revalidatePath("/finance/payments");
  revalidatePath("/finance/invoices");

  return {
    success: true,
  };
}
