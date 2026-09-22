import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

import {
  schools,
  academicYears,
  terms,
  classLevels,
  streams,
  subjects,
} from "@/db/schema";
import { eq, and } from "drizzle-orm";

async function seed() {
  // Load the database only after .env.local has been loaded.
  const { db } = await import("@/db");

  console.log("🌱 Starting Heisen SchoolOS seed...");

  // ============================================================
  // 1. SCHOOL
  // ============================================================

  let [school] = await db
    .select()
    .from(schools)
    .where(eq(schools.slug, "heisen-demo-school"))
    .limit(1);

  if (!school) {
    [school] = await db
      .insert(schools)
      .values({
        name: "Heisen Demo School",
        slug: "heisen-demo-school",
        schoolCode: "HEISEN001",
        schoolType: "private_basic",
        region: "Volta",
        district: "Ho Municipal",
        town: "Ho",
        address: "Heisen Demo School",
        status: "active",
      })
      .returning();

    console.log("✓ Created demo school");
  } else {
    console.log("✓ Demo school already exists");
  }

  // ============================================================
  // 2. ACADEMIC YEAR
  // ============================================================

  let [academicYear] = await db
    .select()
    .from(academicYears)
    .where(
      and(
        eq(academicYears.schoolId, school.id),
        eq(academicYears.name, "2026/2027"),
      ),
    )
    .limit(1);

  if (!academicYear) {
    [academicYear] = await db
      .insert(academicYears)
      .values({
        schoolId: school.id,
        name: "2026/2027",
        startDate: "2026-09-01",
        endDate: "2027-07-31",
        isCurrent: true,
      })
      .returning();

    console.log("✓ Created 2026/2027 academic year");
  } else {
    console.log("✓ Academic year already exists");
  }

  // ============================================================
  // 3. TERMS
  // ============================================================

  const termData = [
    {
      name: "First Term",
      termNumber: 1,
      startDate: "2026-09-01",
      endDate: "2026-12-18",
      isCurrent: true,
    },
    {
      name: "Second Term",
      termNumber: 2,
      startDate: "2027-01-11",
      endDate: "2027-04-09",
      isCurrent: false,
    },
    {
      name: "Third Term",
      termNumber: 3,
      startDate: "2027-04-26",
      endDate: "2027-07-31",
      isCurrent: false,
    },
  ];

  for (const term of termData) {
    const existing = await db
      .select()
      .from(terms)
      .where(
        and(
          eq(terms.academicYearId, academicYear.id),
          eq(terms.termNumber, term.termNumber),
        ),
      )
      .limit(1);

    if (existing.length === 0) {
      await db.insert(terms).values({
        academicYearId: academicYear.id,
        ...term,
      });

      console.log(`✓ Created ${term.name}`);
    } else {
      console.log(`✓ ${term.name} already exists`);
    }
  }

  // ============================================================
  // 4. CLASS LEVELS
  // ============================================================

  const classData = [
    {
      name: "Creche",
      category: "creche" as const,
      sortOrder: 1,
    },
    {
      name: "Nursery 1",
      category: "nursery" as const,
      sortOrder: 2,
    },
    {
      name: "Nursery 2",
      category: "nursery" as const,
      sortOrder: 3,
    },
    {
      name: "KG 1",
      category: "kg" as const,
      sortOrder: 4,
    },
    {
      name: "KG 2",
      category: "kg" as const,
      sortOrder: 5,
    },
    {
      name: "Primary 1",
      category: "primary" as const,
      sortOrder: 6,
    },
    {
      name: "Primary 2",
      category: "primary" as const,
      sortOrder: 7,
    },
    {
      name: "Primary 3",
      category: "primary" as const,
      sortOrder: 8,
    },
    {
      name: "Primary 4",
      category: "primary" as const,
      sortOrder: 9,
    },
    {
      name: "Primary 5",
      category: "primary" as const,
      sortOrder: 10,
    },
    {
      name: "Primary 6",
      category: "primary" as const,
      sortOrder: 11,
    },
    {
      name: "JHS 1",
      category: "jhs" as const,
      sortOrder: 12,
    },
    {
      name: "JHS 2",
      category: "jhs" as const,
      sortOrder: 13,
    },
    {
      name: "JHS 3",
      category: "jhs" as const,
      sortOrder: 14,
    },
  ];

  for (const classDataItem of classData) {
    const existing = await db
      .select()
      .from(classLevels)
      .where(
        and(
          eq(classLevels.schoolId, school.id),
          eq(classLevels.name, classDataItem.name),
        ),
      )
      .limit(1);

    if (existing.length === 0) {
      await db.insert(classLevels).values({
        schoolId: school.id,
        ...classDataItem,
      });

      console.log(`✓ Created ${classDataItem.name}`);
    } else {
      console.log(`✓ ${classDataItem.name} already exists`);
    }
  }

  // ============================================================
  // 5. STREAMS
  // ============================================================

  const classLevelsFromDb = await db
    .select()
    .from(classLevels)
    .where(eq(classLevels.schoolId, school.id));

  for (const classLevel of classLevelsFromDb) {
    const existing = await db
      .select()
      .from(streams)
      .where(
        and(
          eq(streams.classLevelId, classLevel.id),
          eq(streams.name, "A"),
        ),
      )
      .limit(1);

    if (existing.length === 0) {
      await db.insert(streams).values({
        classLevelId: classLevel.id,
        name: "A",
        capacity: 40,
      });

      console.log(`✓ Created ${classLevel.name} A`);
    } else {
      console.log(`✓ ${classLevel.name} A already exists`);
    }
  }

  // ============================================================
  // 6. SUBJECTS
  // ============================================================

  const subjectData = [
    {
      name: "English Language",
      code: "ENG",
    },
    {
      name: "Mathematics",
      code: "MATH",
    },
    {
      name: "Science",
      code: "SCI",
    },
    {
      name: "Social Studies",
      code: "SST",
    },
    {
      name: "Computing",
      code: "ICT",
    },
    {
      name: "Religious and Moral Education",
      code: "RME",
    },
    {
      name: "Creative Arts",
      code: "CA",
    },
    {
      name: "Physical Education",
      code: "PE",
    },
    {
      name: "Ghanaian Language",
      code: "GL",
    },
    {
      name: "Career Technology",
      code: "CT",
    },
    {
      name: "French",
      code: "FRE",
    },
  ];

  for (const subject of subjectData) {
    const existing = await db
      .select()
      .from(subjects)
      .where(
        and(
          eq(subjects.schoolId, school.id),
          eq(subjects.name, subject.name),
        ),
      )
      .limit(1);

    if (existing.length === 0) {
      await db.insert(subjects).values({
        schoolId: school.id,
        ...subject,
      });

      console.log(`✓ Created ${subject.name}`);
    } else {
      console.log(`✓ ${subject.name} already exists`);
    }
  }

  console.log("");
  console.log("✅ Heisen SchoolOS seed completed successfully.");
  console.log(`School: ${school.name}`);
  console.log(`School ID: ${school.id}`);
}

seed().catch((error) => {
  console.error("❌ Seed failed:");
  console.error(error);
  process.exit(1);
});