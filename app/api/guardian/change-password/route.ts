import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { guardianUserAccounts } from "@/db/schema";
import { getNeonAuth } from "@/lib/auth/server";

export async function POST() {
  const { data } = await getNeonAuth().getSession();
  const email = data?.user?.email?.trim().toLowerCase();
  if (!email) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const [account] = await db.select({ id: guardianUserAccounts.id }).from(guardianUserAccounts).where(and(eq(guardianUserAccounts.email, email), eq(guardianUserAccounts.status, "active"))).limit(1);
  if (!account) return NextResponse.json({ error: "Active guardian account not found." }, { status: 404 });
  await db.update(guardianUserAccounts).set({ mustChangePassword: false, passwordExpiresAt: null, updatedAt: new Date() }).where(eq(guardianUserAccounts.id, account.id));
  return NextResponse.json({ success: true });
}
