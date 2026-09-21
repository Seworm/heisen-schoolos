import { NextResponse } from "next/server";
import { requireCurrentSchool } from "@/lib/current-school";
import { requireTeacherScope } from "@/lib/authorization";
import { getSchoolInsights } from "@/lib/insights";

export async function GET() {
  try {
    const school = await requireCurrentSchool();
    await requireTeacherScope(school.id);
    return NextResponse.json(await getSchoolInsights(school.id), {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
}
