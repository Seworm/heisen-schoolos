import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { schoolMemberships, schools } from "@/db/schema";
import { requireAuth } from "@/lib/authorization";

export async function getActiveSchoolContext() {
  const user = await requireAuth();
  if (!user.schoolId) throw new Error("No active school is associated with this account.");
  const [school] = await db.select({ id: schools.id, name: schools.name, slug: schools.slug, status: schools.status })
    .from(schools)
    .innerJoin(schoolMemberships, eq(schoolMemberships.schoolId, schools.id))
    .where(and(eq(schools.id, user.schoolId), eq(schoolMemberships.userId, user.id), eq(schoolMemberships.isActive, true)))
    .limit(1);
  if (!school) throw new Error("Active school membership not found.");
  return { user, school };
}
