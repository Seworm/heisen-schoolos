import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { requireCurrentSchool } from "@/lib/current-school";
import { SchoolSidebar } from "@/components/SchoolSidebar";
import { SchoolTopbar } from "@/components/SchoolTopbar";
import { getApplicationSession } from "@/lib/auth/compat";
import { getAvailableSchools } from "@/lib/school-workspace";
import { ACTIVE_SCHOOL_COOKIE_NAME } from "@/lib/current-school";
import { isPlatformUser } from "@/lib/authorization";
import SchoolSelection from "./SchoolSelection";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getApplicationSession();
  const activeSchoolId = (await cookies()).get(ACTIVE_SCHOOL_COOKIE_NAME)?.value;
  const isPlatformAdmin = session ? isPlatformUser(session.user) : false;

  if (isPlatformAdmin && !session?.user.schoolId && !activeSchoolId) {
    const availableSchools = await getAvailableSchools();

    return <SchoolSelection schools={availableSchools} />;
  }

  const school = await requireCurrentSchool();
  const availableSchools =
    isPlatformAdmin ? await getAvailableSchools() : [];

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.12),transparent_20%),radial-gradient(circle_at_bottom_right,_rgba(14,165,233,0.10),transparent_22%),#f3f7fb] text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-[1800px] gap-5 px-3 py-3 lg:px-4">
        <div className="hidden lg:block">
          <SchoolSidebar isPlatformAdmin={isPlatformAdmin} />
        </div>

        <div className="min-w-0 flex-1 rounded-[28px] border border-slate-200 bg-white/90 shadow-[0_18px_60px_rgba(15,23,42,0.06)] backdrop-blur-xl">
          <SchoolTopbar
            school={school}
            availableSchools={availableSchools}
            isPlatformAdmin={isPlatformAdmin}
          />

          <main className="min-h-[calc(100vh-5rem)] px-4 py-5 sm:px-6 lg:px-8">
            <div className="mx-auto w-full max-w-[1600px]">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
