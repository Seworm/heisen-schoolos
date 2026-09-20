import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { students, studentUserAccounts } from "@/db/schema";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const studentNumber = String(body.studentNumber ?? "")
      .trim()
      .toUpperCase();

    if (!studentNumber) {
      return NextResponse.json(
        { error: "Student number is required." },
        { status: 400 },
      );
    }

    const [account] = await db
      .select({
        email: studentUserAccounts.email,
      })
      .from(studentUserAccounts)
      .innerJoin(
        students,
        eq(students.id, studentUserAccounts.studentId),
      )
      .where(
        and(
          eq(students.studentNumber, studentNumber),
          eq(studentUserAccounts.status, "active"),
        ),
      )
      .limit(1);

    if (!account) {
      return NextResponse.json(
        { error: "Invalid student login details." },
        { status: 401 },
      );
    }

    return NextResponse.json({
      email: account.email,
    });
  } catch {
    return NextResponse.json(
      { error: "Unable to process student login." },
      { status: 500 },
    );
  }
}


