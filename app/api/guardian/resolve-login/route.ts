import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { guardianUserAccounts, guardians } from "@/db/schema";

function normalizePhone(value: string) {
  return value.replace(/\D+/g, "").replace(/^0+/, "");
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body.email ?? "").trim().toLowerCase();
    const phone = String(body.phone ?? "").trim();
    const password = String(body.password ?? "");

    if (!email || !phone || !password) {
      return NextResponse.json(
        { error: "Guardian email and phone are required." },
        { status: 400 },
      );
    }

    const normalizedPhone = normalizePhone(phone);

    const [account] = await db
      .select({
        email: guardianUserAccounts.email,
      })
      .from(guardianUserAccounts)
      .innerJoin(
        guardians,
        eq(guardians.id, guardianUserAccounts.guardianId),
      )
      .where(
        and(
          eq(guardianUserAccounts.email, email),
          eq(guardianUserAccounts.status, "active"),
          eq(guardians.phone, normalizedPhone || phone),
        ),
      )
      .limit(1);

    if (!account) {
      return NextResponse.json(
        { error: "Invalid guardian login details." },
        { status: 401 },
      );
    }

    return NextResponse.json({ email: account.email });
  } catch {
    return NextResponse.json(
      { error: "Unable to process guardian login." },
      { status: 500 },
    );
  }
}
