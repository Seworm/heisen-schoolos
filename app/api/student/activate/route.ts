import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import {
  students,
  studentUserAccounts,
} from "@/db/schema";

export async function POST(
  request: Request,
) {
  try {
    const body = await request.json();

    const studentNumber =
      typeof body.studentNumber === "string"
        ? body.studentNumber.trim()
        : "";

    const email =
      typeof body.email === "string"
        ? body.email.trim().toLowerCase()
        : "";

    const activationCode =
      typeof body.activationCode === "string"
        ? body.activationCode.trim().toUpperCase()
        : "";

    const password =
      typeof body.password === "string"
        ? body.password
        : "";

    if (
      !studentNumber ||
      !email ||
      !activationCode ||
      !password
    ) {
      return NextResponse.json(
        {
          error:
            "Student number, email, activation code and password are required.",
        },
        { status: 400 },
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        {
          error:
            "Password must be at least 8 characters.",
        },
        { status: 400 },
      );
    }

    const [account] = await db
      .select({
        accountId: studentUserAccounts.id,
        studentId: studentUserAccounts.studentId,
        accountEmail: studentUserAccounts.email,
        status: studentUserAccounts.status,
        activationCodeHash:
          studentUserAccounts.activationCodeHash,
        activationCodeExpiresAt:
          studentUserAccounts.activationCodeExpiresAt,
        studentNumber: students.studentNumber,
      })
      .from(studentUserAccounts)
      .innerJoin(
        students,
        eq(
          studentUserAccounts.studentId,
          students.id,
        ),
      )
      .where(
        eq(
          studentUserAccounts.email,
          email,
        ),
      )
      .limit(1);

    if (!account) {
      return NextResponse.json(
        {
          error:
            "Invalid activation details.",
        },
        { status: 400 },
      );
    }

    if (
      account.studentNumber !==
      studentNumber
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid activation details.",
        },
        { status: 400 },
      );
    }

    if (account.status !== "pending") {
      return NextResponse.json(
        {
          error:
            "This student account is no longer pending activation.",
        },
        { status: 400 },
      );
    }

    if (
      !account.activationCodeHash ||
      !account.activationCodeExpiresAt
    ) {
      return NextResponse.json(
        {
          error:
            "This activation code is invalid.",
        },
        { status: 400 },
      );
    }

    if (
      new Date(
        account.activationCodeExpiresAt,
      ).getTime() <= Date.now()
    ) {
      return NextResponse.json(
        {
          error:
            "This activation code has expired.",
        },
        { status: 400 },
      );
    }

    const validCode =
      await bcrypt.compare(
        activationCode,
        account.activationCodeHash,
      );

    if (!validCode) {
      return NextResponse.json(
        {
          error:
            "Invalid activation details.",
        },
        { status: 400 },
      );
    }

    const passwordHash =
      await bcrypt.hash(password, 12);

    await db
      .update(studentUserAccounts)
      .set({
        passwordHash,
        activationCodeHash: null,
        activationCodeExpiresAt: null,
        activatedAt: new Date(),
        status: "active",
        updatedAt: new Date(),
      })
      .where(
        eq(
          studentUserAccounts.id,
          account.accountId,
        ),
      );

    return NextResponse.json({
      success: true,
      message:
        "Student account activated successfully.",
    });
  } catch (error) {
    console.error(
      "Student activation error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Unable to activate the account.",
      },
      { status: 500 },
    );
  }
}
