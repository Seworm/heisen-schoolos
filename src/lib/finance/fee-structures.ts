import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  feeCategories,
  feeStructureItems,
  feeStructures,
  academicYears,
  classLevels,
  terms,
} from "@/db/schema";
import {
  normaliseText,
  parsePositiveMoney,
  requireText,
  requireUuid,
} from "./finance-utils";

export async function createFeeCategory(input: {
  schoolId: string;
  name: string;
  description?: string;
}) {
  const schoolId = requireUuid(input.schoolId, "School");

  const name = requireText(input.name, "Fee category name");

  const existing = await db
    .select({ id: feeCategories.id })
    .from(feeCategories)
    .where(
      and(
        eq(feeCategories.schoolId, schoolId),
        eq(feeCategories.name, name),
      ),
    )
    .limit(1);

  if (existing.length > 0) {
    throw new Error("A fee category with this name already exists.");
  }

  const [category] = await db
    .insert(feeCategories)
    .values({
      schoolId,
      name,
      description: normaliseText(input.description),
      isActive: true,
    })
    .returning();

  return category;
}

export async function updateFeeCategory(input: {
  schoolId: string;
  categoryId: string;
  name: string;
  description?: string;
}) {
  const schoolId = requireUuid(input.schoolId, "School");
  const categoryId = requireUuid(input.categoryId, "Fee category");

  const name = requireText(input.name, "Fee category name");

  const existing = await db
    .select({ id: feeCategories.id })
    .from(feeCategories)
    .where(
      and(
        eq(feeCategories.id, categoryId),
        eq(feeCategories.schoolId, schoolId),
        eq(feeCategories.isActive, true),
      ),
    )
    .limit(1);

  if (existing.length === 0) {
    throw new Error("Fee category not found.");
  }

  const duplicate = await db
    .select({ id: feeCategories.id })
    .from(feeCategories)
    .where(
      and(
        eq(feeCategories.schoolId, schoolId),
        eq(feeCategories.name, name),
      ),
    )
    .limit(1);

  if (duplicate.length > 0 && duplicate[0].id !== categoryId) {
    throw new Error("A fee category with this name already exists.");
  }

  const [category] = await db
    .update(feeCategories)
    .set({
      name,
      description: normaliseText(input.description),
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(feeCategories.id, categoryId),
        eq(feeCategories.schoolId, schoolId),
      ),
    )
    .returning();

  return category;
}

export async function setFeeCategoryActive(
  schoolId: string,
  categoryId: string,
  isActive: boolean,
) {
  requireUuid(schoolId, "School");
  requireUuid(categoryId, "Fee category");

  const [category] = await db
    .update(feeCategories)
    .set({
      isActive,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(feeCategories.id, categoryId),
        eq(feeCategories.schoolId, schoolId),
      ),
    )
    .returning();

  if (!category) {
    throw new Error("Fee category not found.");
  }

  return category;
}

export async function createFeeStructure(input: {
  schoolId: string;
  academicYearId: string;
  termId: string;
  classLevelId: string;
  name: string;
  description?: string;
  items: Array<{
    feeCategoryId: string;
    amount: string | number;
    description?: string;
  }>;
}) {
  const schoolId = requireUuid(input.schoolId, "School");
  const academicYearId = requireUuid(
    input.academicYearId,
    "Academic year",
  );
  const termId = requireUuid(input.termId, "Term");
  const classLevelId = requireUuid(
    input.classLevelId,
    "Class level",
  );

  const name = requireText(input.name, "Fee structure name");

  if (!input.items?.length) {
    throw new Error("At least one fee item is required.");
  }

  const [academicYear] = await db
    .select({ id: academicYears.id })
    .from(academicYears)
    .where(
      and(
        eq(academicYears.id, academicYearId),
        eq(academicYears.schoolId, schoolId),
      ),
    )
    .limit(1);

  if (!academicYear) {
    throw new Error("Academic year not found.");
  }

  const [term] = await db
    .select({
      id: terms.id,
      academicYearId: terms.academicYearId,
    })
    .from(terms)
    .innerJoin(
      academicYears,
      eq(academicYears.id, terms.academicYearId),
    )
    .where(
      and(
        eq(terms.id, termId),
        eq(academicYears.schoolId, schoolId),
      ),
    )
    .limit(1);

  if (!term || term.academicYearId !== academicYearId) {
    throw new Error(
      "The selected term does not belong to the academic year.",
    );
  }

  const [classLevel] = await db
    .select({ id: classLevels.id })
    .from(classLevels)
    .where(
      and(
        eq(classLevels.id, classLevelId),
        eq(classLevels.schoolId, schoolId),
      ),
    )
    .limit(1);

  if (!classLevel) {
    throw new Error("Class level not found.");
  }

  const duplicate = await db
    .select({ id: feeStructures.id })
    .from(feeStructures)
    .where(
      and(
        eq(feeStructures.schoolId, schoolId),
        eq(feeStructures.academicYearId, academicYearId),
        eq(feeStructures.termId, termId),
        eq(feeStructures.classLevelId, classLevelId),
        eq(feeStructures.name, name),
      ),
    )
    .limit(1);

  if (duplicate.length > 0) {
    throw new Error("A fee structure with this name already exists for this scope.");
  }

  const categoryIds = input.items.map((item) =>
    requireUuid(item.feeCategoryId, "Fee category"),
  );

  if (new Set(categoryIds).size !== categoryIds.length) {
    throw new Error("A fee category cannot appear twice in the same structure.");
  }

  const categories = await db
    .select({
      id: feeCategories.id,
    })
    .from(feeCategories)
    .where(eq(feeCategories.schoolId, schoolId));

  const categorySet = new Set(categories.map((category) => category.id));

  for (const categoryId of categoryIds) {
    if (!categorySet.has(categoryId)) {
      throw new Error("One or more fee categories do not belong to this school.");
    }
  }

  return db.transaction(async (tx) => {
    const [structure] = await tx
      .insert(feeStructures)
      .values({
        schoolId,
        academicYearId,
        termId,
        classLevelId,
        name,
        description: normaliseText(input.description),
        isActive: true,
      })
      .returning();

    if (!structure) {
      throw new Error("Failed to create fee structure.");
    }

    await tx.insert(feeStructureItems).values(
      input.items.map((item) => ({
        feeStructureId: structure.id,
        feeCategoryId: requireUuid(
          item.feeCategoryId,
          "Fee category",
        ),
        amount: parsePositiveMoney(item.amount, "Fee amount"),
        description: normaliseText(item.description),
      })),
    );

    return structure;
  });
}

export async function replaceFeeStructureItems(input: {
  schoolId: string;
  feeStructureId: string;
  items: Array<{
    feeCategoryId: string;
    amount: string | number;
    description?: string;
  }>;
}) {
  const schoolId = requireUuid(input.schoolId, "School");
  const feeStructureId = requireUuid(
    input.feeStructureId,
    "Fee structure",
  );

  if (!input.items.length) {
    throw new Error("At least one fee item is required.");
  }

  const [structure] = await db
    .select({ id: feeStructures.id })
    .from(feeStructures)
    .where(
      and(
        eq(feeStructures.id, feeStructureId),
        eq(feeStructures.schoolId, schoolId),
      ),
    )
    .limit(1);

  if (!structure) {
    throw new Error("Fee structure not found.");
  }

  const categoryIds = input.items.map((item) =>
    requireUuid(item.feeCategoryId, "Fee category"),
  );

  if (new Set(categoryIds).size !== categoryIds.length) {
    throw new Error("A fee category cannot appear twice in the same structure.");
  }

  return db.transaction(async (tx) => {
    await tx
      .delete(feeStructureItems)
      .where(eq(feeStructureItems.feeStructureId, feeStructureId));

    await tx.insert(feeStructureItems).values(
      input.items.map((item) => ({
        feeStructureId,
        feeCategoryId: requireUuid(
          item.feeCategoryId,
          "Fee category",
        ),
        amount: parsePositiveMoney(item.amount, "Fee amount"),
        description: normaliseText(item.description),
      })),
    );

    return true;
  });
}

export async function setFeeStructureActive(
  schoolId: string,
  feeStructureId: string,
  isActive: boolean,
) {
  requireUuid(schoolId, "School");
  requireUuid(feeStructureId, "Fee structure");

  const [structure] = await db
    .update(feeStructures)
    .set({
      isActive,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(feeStructures.id, feeStructureId),
        eq(feeStructures.schoolId, schoolId),
      ),
    )
    .returning();

  if (!structure) {
    throw new Error("Fee structure not found.");
  }

  return structure;
}