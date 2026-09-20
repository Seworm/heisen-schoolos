import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { studentUserAccounts } from "@/db/schema";
import { getNeonAuth } from "@/lib/auth/server";

export async function POST() {
  try {
    const { data } = await getNeonAuth().getSession();
    const authUser = data?.user;

    if (!authUser?.email) {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 },
      );
    }

    const email = authUser.email.trim().toLowerCase();

    const [account] = await db
      .select({
        studentId: studentUserAccounts.studentId,
        status: studentUserAccounts.status,
      })
      .from(studentUserAccounts)
      .where(
        and(
          eq(studentUserAccounts.email, email),
          eq(studentUserAccounts.status, "active"),
        ),
      )
      .limit(1);

    if (!account) {
      return NextResponse.json(
        { error: "Active student account not found." },
        { status: 404 },
      );
    }

    await db
      .update(studentUserAccounts)
      .set({
        mustChangePassword: false,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(studentUserAccounts.studentId, account.studentId),
          eq(studentUserAccounts.status, "active"),
        ),
      );

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Unable to complete password change." },
      { status: 500 },
    );
  }
}


