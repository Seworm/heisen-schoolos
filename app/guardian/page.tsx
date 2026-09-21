import { redirect } from "next/navigation";

export default function GuardianPortalRootPage() {
  redirect("/guardian/dashboard");
}
