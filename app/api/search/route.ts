import { NextResponse } from "next/server";
import { and, eq, ilike, or } from "drizzle-orm";
import { db } from "@/db";
import { classLevels, guardians, staff, students } from "@/db/schema";
import { requireAuth } from "@/lib/authorization";

export async function GET(request: Request) {
  try {
    const user = await requireAuth();

    const q = new URL(request.url).searchParams.get("q")?.trim() ?? "";

    if (q.length < 2) {
      return NextResponse.json({ results: [] });
    }

    const pattern = `%${q}%`;

    const [studentRows, staffRows, guardianRows, classRows] =
      await Promise.all([
        db
          .select({
            id: students.id,
            title: students.firstName,
            subtitle: students.lastName,
            meta: students.studentNumber,
          })
          .from(students)
          .where(
            and(
              eq(students.schoolId, user.schoolId),
              or(
                ilike(students.firstName, pattern),
                ilike(students.lastName, pattern),
                ilike(students.studentNumber, pattern),
              ),
            ),
          )
          .limit(10),

        db
          .select({
            id: staff.id,
            title: staff.firstName,
            subtitle: staff.lastName,
            meta: staff.staffNumber,
          })
          .from(staff)
          .where(
            and(
              eq(staff.schoolId, user.schoolId),
              or(
                ilike(staff.firstName, pattern),
                ilike(staff.lastName, pattern),
                ilike(staff.staffNumber, pattern),
              ),
            ),
          )
          .limit(10),

        db
          .select({
            id: guardians.id,
            title: guardians.firstName,
            subtitle: guardians.lastName,
            meta: guardians.phone,
          })
          .from(guardians)
          .where(
            and(
              eq(guardians.schoolId, user.schoolId),
              or(
                ilike(guardians.firstName, pattern),
                ilike(guardians.lastName, pattern),
                ilike(guardians.phone, pattern),
              ),
            ),
          )
          .limit(10),

        db
          .select({
  id: classLevels.id,
  title: classLevels.name,
  meta: classLevels.category,
})
          .from(classLevels)
          .where(
            and(
              eq(classLevels.schoolId, user.schoolId),
              ilike(classLevels.name, pattern),
            ),
          )
          .limit(10),
      ]);

    return NextResponse.json({
      results: [
        ...studentRows.map((r) => ({ ...r, type: "student" as const })),
        ...staffRows.map((r) => ({ ...r, type: "staff" as const })),
        ...guardianRows.map((r) => ({ ...r, type: "guardian" as const })),
       ...classRows.map((r) => ({
  ...r,
  subtitle: "Class",
  type: "class" as const,
}))
      ],
    });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

