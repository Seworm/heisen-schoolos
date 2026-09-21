"use server";

import { eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { db } from "@/db";
import { users } from "@/db/schema";
import { requireSuperAdmin } from "@/lib/authorization";
import { getNeonAuth } from "@/lib/auth/server";

const adminSchema = z.object({
  email: z.string().email(),
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(100),
});

export async function createPlatformAdmin(input: unknown) {
  await requireSuperAdmin();
  const data = adminSchema.parse(input);
  const email = data.email.trim().toLowerCase();
  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (existing) throw new Error("A local account already exists for this email.");

  const temporaryPassword = `${randomUUID()}A9!`;
  const result = await getNeonAuth().admin.createUser({
    email,
    password: temporaryPassword,
    name: `${data.firstName} ${data.lastName}`,
    role: "user",
  });
  if (result.error) throw new Error(result.error.message || "Unable to create the co-admin authentication account.");

  const [user] = await db.insert(users).values({
    email,
    passwordHash: "NEON_AUTH_MANAGED",
    firstName: data.firstName,
    lastName: data.lastName,
    platformRole: "platform_admin",
    status: "active",
  }).returning({ id: users.id });
  if (!user) throw new Error("Unable to create the co-admin profile.");
  return { success: true, email, temporaryPassword };
}
