import { NextResponse } from "next/server";
import { getCurrentSchool } from "@/lib/current-school";
import { verifyPaymentIntent } from "@/lib/payments/service";

export async function POST(request: Request) {
  try {
    const school = await getCurrentSchool();
    const body = await request.json();
    const result = await verifyPaymentIntent({
      schoolId: school.id,
      intentId: String(body.intentId ?? ""),
      providerTransactionId: String(body.providerTransactionId ?? ""),
    });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to verify payment." },
      { status: 400 },
    );
  }
}
