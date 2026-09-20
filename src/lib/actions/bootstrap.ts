"use server";

import { eq } from "drizzle-orm";
import { db } from "@/db";
import {
  schoolMemberships,
  schools,
  users,
} from "@/db/schema";
import { getNeonAuth } from "@/lib/auth/server";

export type BootstrapResult =
  | {
      success: true;
      schoolId: string;
    }
  | {
      success: false;
      error: string;
    };

export async function bootstrapPlatformAdmin(input: {
  schoolName: string;
  schoolCode: string;
  firstName: string;
  lastName: string;
}): Promise<BootstrapResult> {
  try {
    const { data } = await getNeonAuth().getSession();
    const authUser = data?.user;

    if (!authUser?.email) {
      return {
        success: false,
        error: "Authentication required.",
      };
    }

    const email = authUser.email.trim().toLowerCase();

    const existingPlatformAdmin = await db
      .select({ id: schoolMemberships.id })
      .from(schoolMemberships)
      .where(eq(schoolMemberships.role, "platform_admin"))
      .limit(1);

    if (existingPlatformAdmin.length > 0) {
      return {
        success: false,
        error: "Platform setup has already been completed.",
      };
    }

    const schoolName = input.schoolName.trim();
    const schoolCode = input.schoolCode.trim().toUpperCase();
    const firstName = input.firstName.trim();
    const lastName = input.lastName.trim();

    if (!schoolName || !schoolCode || !firstName || !lastName) {
      return {
        success: false,
        error: "All required fields must be completed.",
      };
    }

    const slug = schoolName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    if (!slug) {
      return {
        success: false,
        error: "A valid school name is required.",
      };
    }

    const result = await db.transaction(async (tx) => {
      const [existingUser] = await tx
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      const user =
        existingUser ??
        (
          await tx
            .insert(users)
            .values({
              email,
              passwordHash: null,
              firstName,
              lastName,
              status: "active",
            })
            .returning({
              id: users.id,
            })
        )[0];

      if (!user) {
        throw new Error("Unable to create the administrator profile.");
      }

      const [existingSchool] = await tx
        .select({ id: schools.id })
        .from(schools)
        .where(eq(schools.schoolCode, schoolCode))
        .limit(1);

      if (existingSchool) {
        throw new Error("A school with this school code already exists.");
      }

      const [school] = await tx
        .insert(schools)
        .values({
          name: schoolName,
          slug,
          schoolCode,
          schoolType: "private_basic",
          status: "active",
        })
        .returning({
          id: schools.id,
        });

      if (!school) {
        throw new Error("Unable to create the school.");
      }

      await tx.insert(schoolMemberships).values({
        userId: user.id,
        schoolId: school.id,
        role: "platform_admin",
        isActive: true,
      });

      return {
        schoolId: school.id,
      };
    });

        return {
      success: true,
      schoolId: result.schoolId,
    };
  } catch (error) {
    console.error("BOOTSTRAP_PLATFORM_ADMIN_FAILED", {
      error,
      message: error instanceof Error ? error.message : String(error),
      cause:
        error instanceof Error && error.cause
          ? error.cause
          : undefined,
      stack: error instanceof Error ? error.stack : undefined,
    });

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Unable to complete platform setup.",
    };
  }
}
