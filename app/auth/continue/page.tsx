import { redirect } from "next/navigation";
import { getApplicationSession } from "@/lib/auth/compat";

export const dynamic = "force-dynamic";

export default async function AuthContinuePage() {
  const session = await getApplicationSession();

  if (!session?.user) {
    redirect("/login");
  }

  const user = session.user;

  if (user.accountType === "student") {
    redirect("/student");
  }

  if (user.role === "super_admin") {
    redirect("/platform");
  }

  redirect("/dashboard");
}
