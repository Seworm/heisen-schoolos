import { NextResponse } from "next/server";
import { getCurrentSchool } from "@/lib/current-school";
import { createPaymentIntent } from "@/lib/payments/service";

export async function POST(request: Request) {
  try {
    const school = await getCurrentSchool();
    const body = await request.json();
    const result = await createPaymentIntent({
      schoolId: school.id,
      studentId: String(body.studentId ?? ""),
      amount: body.amount,
      allocations: body.allocations ?? [],
      provider: body.provider,
      paymentMethod: body.paymentMethod,
    });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to create payment intent." },
      { status: 400 },
    );
  }
}
