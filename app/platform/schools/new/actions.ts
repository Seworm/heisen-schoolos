"use server";

import { z } from "zod";
import { db } from "@/db";
import { schoolSettings, schools } from "@/db/schema";
import { requireSuperAdmin } from "@/lib/authorization";
import { writeAuditLog } from "@/lib/audit";

const schoolSchema = z.object({
  name: z.string().trim().min(2).max(200),
  slug: z.string().trim().toLowerCase().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  schoolCode: z.string().trim().toUpperCase().min(2).max(50),
});

export async function createSchool(input: unknown) {
  const actor = await requireSuperAdmin();
  const data = schoolSchema.parse(input);

  const [school] = await db
    .insert(schools)
    .values({
      name: data.name,
      slug: data.slug,
      schoolCode: data.schoolCode,
      status: "active",
    })
    .returning({ id: schools.id, name: schools.name });

  if (!school) {
    throw new Error("The school could not be created.");
  }

  await db.insert(schoolSettings).values({ schoolId: school.id });
  await writeAuditLog({
    schoolId: school.id,
    actorAuthUserId: actor.authUserId ?? actor.id,
    action: "school_created",
    entity: "school",
    entityId: school.id,
    metadata: { name: school.name, slug: data.slug, schoolCode: data.schoolCode },
  });

  return school;
}
