import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/authorization";
import { getPlatformInsights } from "@/lib/insights";

export async function GET() {
  try {
    await requireSuperAdmin();
    return NextResponse.json(await getPlatformInsights(), {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
}
