import { NextRequest } from "next/server";
import { getNeonAuth } from "@/lib/auth/server";

export default function proxy(request: NextRequest) {
  return getNeonAuth().middleware({
    loginUrl: "/login",
  })(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api|login|setup|student/login).*)",
  ],
};