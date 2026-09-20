import { getNeonAuth } from "@/lib/auth/server";
import type { NextRequest } from "next/server";

type NextAuthRouteContext = {
  params: Promise<{
    nextauth: string[];
  }>;
};

export async function GET(
  request: NextRequest,
  context: NextAuthRouteContext,
) {
  const { nextauth } = await context.params;

  return getNeonAuth().handler().GET(request, {
    params: Promise.resolve({
      path: nextauth,
    }),
  });
}

export async function POST(
  request: NextRequest,
  context: NextAuthRouteContext,
) {
  const { nextauth } = await context.params;

  return getNeonAuth().handler().POST(request, {
    params: Promise.resolve({
      path: nextauth,
    }),
  });
}