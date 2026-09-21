import { NextResponse } from "next/server";
import { getCurrentSchool } from "@/lib/current-school";
import { verifyPaymentIntent } from "@/lib/payments/service";

/**
 * Reconciliation intentionally uses the same provider adapter and idempotent
 * intent record as verification; no provider-specific API is exposed here.
 */
export async function POST(request: Request) {
  try {
    const school = await getCurrentSchool();
    const body = await request.json();
    const result = await verifyPaymentIntent({
      schoolId: school.id,
      intentId: String(body.intentId ?? ""),
      providerTransactionId: String(body.providerTransactionId ?? ""),
    });
    return NextResponse.json({ ...result, reconciled: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to reconcile payment." },
      { status: 400 },
    );
  }
}
