import { NextResponse } from "next/server";
import { getCurrentSchool } from "@/lib/current-school";
import { getPaymentIntentStatus } from "@/lib/payments/service";

export async function GET(
  _request: Request,
  context: { params: Promise<{ intentId: string }> },
) {
  try {
    const school = await getCurrentSchool();
    const { intentId } = await context.params;
    return NextResponse.json(await getPaymentIntentStatus(school.id, intentId));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Payment intent not found." },
      { status: 404 },
    );
  }
}
