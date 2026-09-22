'use server';

import { and, eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';

import { db } from '@/db';
import { classLevels, streams } from '@/db/schema';
import { requireCurrentSchool } from '@/lib/current-school';

const VALID_CATEGORIES = [
  'creche',
  'nursery',
  'kg',
  'primary',
  'jhs',
] as const;

type ClassCategory = (typeof VALID_CATEGORIES)[number];

export async function createClassLevel(formData: FormData) {
  const school = await requireCurrentSchool();

  const name = String(formData.get('name') ?? '').trim();
  const category = String(formData.get('category') ?? '') as ClassCategory;
  const sortOrderValue = String(formData.get('sortOrder') ?? '').trim();

  if (!name) {
    throw new Error('Class name is required.');
  }

  if (name.length > 100) {
    throw new Error('Class name must be 100 characters or fewer.');
  }

  if (!VALID_CATEGORIES.includes(category)) {
    throw new Error('Invalid class category.');
  }

  const sortOrder = Number(sortOrderValue);

  if (!Number.isInteger(sortOrder) || sortOrder < 0) {
    throw new Error('Sort order must be a non-negative whole number.');
  }

  const existing = await db
    .select({ id: classLevels.id })
    .from(classLevels)
    .where(
      and(
        eq(classLevels.schoolId, school.id),
        eq(classLevels.name, name),
      ),
    )
    .limit(1);

  if (existing.length > 0) {
    throw new Error('A class with this name already exists.');
  }

  await db.transaction(async (tx) => {
    const [classLevel] = await tx
      .insert(classLevels)
      .values({
        schoolId: school.id,
        name,
        category,
        sortOrder,
      })
      .returning({ id: classLevels.id });

    if (!classLevel) {
      throw new Error('The class could not be created.');
    }

    await tx.insert(streams).values({
      classLevelId: classLevel.id,
      name: 'A',
      capacity: 40,
    });
  });

  redirect('/academics/classes');
}

